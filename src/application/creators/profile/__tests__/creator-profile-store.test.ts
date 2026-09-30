import { ConflictFailure, NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { RecipePage } from '@domain/recipes/list/recipe-page';
import { StoreStatus } from '@application/store/store-status';
import { configureCreatorProfileStore } from '@application/creators/profile/creator-profile-store';
import { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import { FollowUserUseCase } from '@application/user-profile/follow/follow-user-use-case';
import { UnfollowUserUseCase } from '@application/user-profile/follow/unfollow-user-use-case';
import { FakeUserProfileRepository } from '@application/__fixtures__/fake-user-profile-repository';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { recipeSummaryOf } from '@application/__fixtures__/recipe-summary-of';
import { viewedProfileOf } from '@application/__fixtures__/viewed-profile-of';
import { CREATOR_RECIPES_PAGE_SIZE } from '@infrastructure/constants/api/api-paging';

const storeOver = (repo: FakeUserProfileRepository) =>
  configureCreatorProfileStore({
    getViewedProfile: new GetViewedUserProfileUseCase(repo),
    listUserRecipes: new ListUserRecipesUseCase(repo),
    follow: new FollowUserUseCase(repo),
    unfollow: new UnfollowUserUseCase(repo),
  });

const deferred = <T>(): { promise: Promise<Result<T, Failure>>; resolve: (answer: Result<T, Failure>) => void } => {
  let resolve!: (answer: Result<T, Failure>) => void;
  const promise = new Promise<Result<T, Failure>>((r) => (resolve = r));
  return { promise, resolve };
};

const loadedRepo = (standing: { followerCount?: number; isFollowedByMe?: boolean } = {}): FakeUserProfileRepository => {
  const repo = new FakeUserProfileRepository();
  repo.viewedAnswers = [ok(viewedProfileOf('u-1', standing))];
  repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-1')], { pageSize: 1, total: 2 }))];
  return repo;
};

describe('creator profile store', () => {
  it('open loads the profile and the first recipe page', async () => {
    const repo = loadedRepo();
    const store = storeOver(repo);

    const opening = store.getState().open('u-1');
    expect(store.getState().profileState.status).toBe(StoreStatus.Loading);
    await opening;

    expect(repo.viewedCalls).toEqual(['u-1']);
    expect(repo.recipeCalls).toEqual([['u-1', 1, CREATOR_RECIPES_PAGE_SIZE]]);
    const { profileState, recipes, recipesState } = store.getState();
    expect(profileState.status === StoreStatus.Loaded && profileState.viewed.profile.id).toBe('u-1');
    expect(recipes.map((r) => r.id)).toEqual(['r-1']);
    expect(recipesState).toEqual({ status: StoreStatus.Loaded, page: 1, hasMore: true });
  });

  it('a failed profile read is an error state', async () => {
    const repo = new FakeUserProfileRepository();
    const failure = new NetworkFailure('offline');
    repo.viewedAnswers = [fail(failure)];
    const store = storeOver(repo);

    await store.getState().open('u-1');

    expect(store.getState().profileState).toEqual({ status: StoreStatus.Error, failure });
  });

  it('re-opening the same user keeps the page on screen while it re-reads', async () => {
    const repo = loadedRepo();
    const store = storeOver(repo);
    await store.getState().open('u-1');
    repo.viewedAnswers = [fail(new NetworkFailure('offline'))];
    repo.recipeAnswers = [fail(new NetworkFailure('offline'))];

    const reopening = store.getState().open('u-1');
    expect(store.getState().profileState.status).toBe(StoreStatus.Loaded);
    await reopening;

    expect(store.getState().profileState.status).toBe(StoreStatus.Loaded);
    expect(store.getState().recipes.map((r) => r.id)).toEqual(['r-1']);
  });

  it('drops the answer for a user that is no longer open', async () => {
    const repo = new FakeUserProfileRepository();
    const slow = deferred<RecipePage>();
    repo.viewedAnswers = [ok(viewedProfileOf('u-1')), ok(viewedProfileOf('u-2'))];
    repo.recipeAnswers = [slow.promise, ok(recipePageOf([recipeSummaryOf('r-2')]))];
    const store = storeOver(repo);

    const first = store.getState().open('u-1');
    await store.getState().open('u-2');
    slow.resolve(ok(recipePageOf([recipeSummaryOf('r-1')])));
    await first;

    expect(store.getState().userId).toBe('u-2');
    expect(store.getState().recipes.map((r) => r.id)).toEqual(['r-2']);
  });

  it('loadMoreRecipes appends the next page and skips a repeat', async () => {
    const repo = loadedRepo();
    const store = storeOver(repo);
    await store.getState().open('u-1');
    repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-1'), recipeSummaryOf('r-2')], { page: 2, pageSize: 1, total: 2 }))];

    await store.getState().loadMoreRecipes();

    expect(repo.recipeCalls[1]).toEqual(['u-1', 2, CREATOR_RECIPES_PAGE_SIZE]);
    expect(store.getState().recipes.map((r) => r.id)).toEqual(['r-1', 'r-2']);
    expect(store.getState().recipesState).toEqual({ status: StoreStatus.Loaded, page: 2, hasMore: false });
  });

  it('toggleFollow follows and counts the viewer in', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const store = storeOver(repo);
    await store.getState().open('u-1');

    const failure = await store.getState().toggleFollow();

    expect(failure).toBeNull();
    expect(repo.followCalls).toEqual(['u-1']);
    const state = store.getState().profileState;
    expect(state.status === StoreStatus.Loaded && state.viewed.isFollowedByMe).toBe(true);
    expect(state.status === StoreStatus.Loaded && state.viewed.followerCount).toBe(11);
    expect(store.getState().isFollowPending).toBe(false);
  });

  it('toggleFollow unfollows a followed profile', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: true });
    const store = storeOver(repo);
    await store.getState().open('u-1');

    await store.getState().toggleFollow();

    expect(repo.unfollowCalls).toEqual(['u-1']);
    const state = store.getState().profileState;
    expect(state.status === StoreStatus.Loaded && state.viewed.followerCount).toBe(9);
  });

  it('a refused follow is put back and returned', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const refusal = new ConflictFailure('nope');
    repo.followAnswer = fail(refusal);
    const store = storeOver(repo);
    await store.getState().open('u-1');

    const failure = await store.getState().toggleFollow();

    expect(failure).toBe(refusal);
    const state = store.getState().profileState;
    expect(state.status === StoreStatus.Loaded && state.viewed.isFollowedByMe).toBe(false);
    expect(state.status === StoreStatus.Loaded && state.viewed.followerCount).toBe(10);
    expect(store.getState().isFollowPending).toBe(false);
  });

  it('the follow button and count flip before the server answers', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const answer = deferred<void>();
    repo.followAnswer = answer.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');

    const toggling = store.getState().toggleFollow();

    const shown = store.getState().profileState;
    expect(shown.status === StoreStatus.Loaded && shown.viewed.isFollowedByMe).toBe(true);
    expect(shown.status === StoreStatus.Loaded && shown.viewed.followerCount).toBe(11);
    expect(store.getState().isFollowPending).toBe(true);
    answer.resolve(ok(undefined));
    expect(await toggling).toBeNull();
  });

  it('a double tap while the follow is in flight sends one request', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const answer = deferred<void>();
    repo.followAnswer = answer.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');

    const first = store.getState().toggleFollow();
    const second = store.getState().toggleFollow();
    answer.resolve(ok(undefined));
    await Promise.all([first, second]);

    expect(repo.followCalls.length).toBe(1);
    expect(repo.unfollowCalls).toEqual([]);
    const state = store.getState().profileState;
    expect(state.status === StoreStatus.Loaded && state.viewed.followerCount).toBe(11);
  });

  it('a refused follow for the previous creator does not roll back the page now open', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const answer = deferred<void>();
    repo.followAnswer = answer.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');

    const toggling = store.getState().toggleFollow();
    repo.viewedAnswers = [ok(viewedProfileOf('u-2', { followerCount: 5, isFollowedByMe: true }))];
    repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-2')]))];
    await store.getState().open('u-2');
    const refusal = new ConflictFailure('nope');
    answer.resolve(fail(refusal));

    expect(await toggling).toBe(refusal);
    const state = store.getState().profileState;
    expect(state.status === StoreStatus.Loaded && state.viewed.profile.id).toBe('u-2');
    expect(state.status === StoreStatus.Loaded && state.viewed.isFollowedByMe).toBe(true);
    expect(state.status === StoreStatus.Loaded && state.viewed.followerCount).toBe(5);
  });

  it('a follow answer from before clear() does not release the next page\'s pending follow', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const stale = deferred<void>();
    repo.followAnswer = stale.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');
    const oldToggle = store.getState().toggleFollow();
    store.getState().clear();
    repo.viewedAnswers = [ok(viewedProfileOf('u-2', { followerCount: 5, isFollowedByMe: false }))];
    repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-2')]))];
    await store.getState().open('u-2');
    const current = deferred<void>();
    repo.followAnswer = current.promise;
    const newToggle = store.getState().toggleFollow();

    stale.resolve(ok(undefined));
    await oldToggle;

    expect(store.getState().isFollowPending).toBe(true);
    current.resolve(ok(undefined));
    await newToggle;
    expect(store.getState().isFollowPending).toBe(false);
  });

  // The guard compared user ids, so after clear() and a reopen of the SAME
  // creator the old answer passed it: it released the new tap's pending state
  // and rolled its flip back.
  it('a refused follow from before clear() does not undo a new tap on the same creator reopened', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const stale = deferred<void>();
    repo.followAnswer = stale.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');
    const oldToggle = store.getState().toggleFollow();
    store.getState().clear();
    repo.viewedAnswers = [ok(viewedProfileOf('u-1', { followerCount: 10, isFollowedByMe: false }))];
    repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-1')]))];
    await store.getState().open('u-1');
    const current = deferred<void>();
    repo.followAnswer = current.promise;
    const newToggle = store.getState().toggleFollow();

    stale.resolve(fail(new ConflictFailure('nope')));
    await oldToggle;

    expect(store.getState().isFollowPending).toBe(true);
    const shown = store.getState().profileState;
    expect(shown.status === StoreStatus.Loaded && shown.viewed.isFollowedByMe).toBe(true);
    expect(shown.status === StoreStatus.Loaded && shown.viewed.followerCount).toBe(11);
    current.resolve(ok(undefined));
    expect(await newToggle).toBeNull();
    expect(store.getState().isFollowPending).toBe(false);
  });

  it('a pull-to-refresh of the same creator still lets the pending follow answer', async () => {
    const repo = loadedRepo({ followerCount: 10, isFollowedByMe: false });
    const answer = deferred<void>();
    repo.followAnswer = answer.promise;
    const store = storeOver(repo);
    await store.getState().open('u-1');
    const toggling = store.getState().toggleFollow();
    repo.viewedAnswers = [ok(viewedProfileOf('u-1', { followerCount: 11, isFollowedByMe: true }))];
    repo.recipeAnswers = [ok(recipePageOf([recipeSummaryOf('r-1')]))];
    await store.getState().refresh();

    answer.resolve(ok(undefined));
    expect(await toggling).toBeNull();

    expect(store.getState().isFollowPending).toBe(false);
  });

  it('clear forgets the page', async () => {
    const store = storeOver(loadedRepo());
    await store.getState().open('u-1');

    store.getState().clear();

    expect(store.getState().userId).toBeNull();
    expect(store.getState().profileState).toEqual({ status: StoreStatus.Idle });
    expect(store.getState().recipes).toEqual([]);
  });
});

/**
 * The saved store owns both the rows the Saved grid renders AND the status that
 * says whether they have been asked for yet.
 *
 * The status is the half that was missing: the screen fetched the favourites
 * itself and had no way to tell an empty grid from an unanswered one, so it
 * rendered "nothing saved yet" for the length of every cold load. `listState`
 * is what the skeleton branch reads.
 */

import { configureSavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeSummary = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const makeStore = (execute: LoadFavoritesUseCase['execute']) =>
  configureSavedRecipesStore({ loadFavoritesUseCase: { execute } as LoadFavoritesUseCase });

describe('savedRecipesStore.loadSaved', () => {
  it('starts idle — the grid has not asked for anything yet', () => {
    const store = makeStore(() => Promise.resolve(ok([])));

    expect(store.getState().listState).toEqual({ status: 'idle' });
  });

  it('is loading while the request is in flight and loaded once it answers', async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const store = makeStore(async () => {
      await held;
      return ok([makeSummary('r1')]);
    });

    const inFlight = store.getState().loadSaved();
    // The frame the skeleton is rendered for.
    expect(store.getState().listState).toEqual({ status: 'loading' });

    release();
    await inFlight;

    expect(store.getState().listState).toEqual({ status: 'loaded' });
  });

  it('publishes the rows and the id set from one response', async () => {
    const rows = [makeSummary('r1'), makeSummary('r2')];
    const store = makeStore(() => Promise.resolve(ok(rows)));

    await store.getState().loadSaved();

    expect(store.getState().savedRecipes).toEqual(rows);
    expect([...store.getState().savedIds]).toEqual(['r1', 'r2']);
  });

  it('answers loaded for an empty response — that IS an empty grid, not a pending one', async () => {
    const store = makeStore(() => Promise.resolve(ok([])));

    await store.getState().loadSaved();

    expect(store.getState().listState).toEqual({ status: 'loaded' });
    expect(store.getState().savedRecipes).toEqual([]);
  });

  it('keeps the rows it already had when a reload fails', async () => {
    const rows = [makeSummary('r1')];
    let call = 0;
    const failure = new NetworkFailure('offline');
    const store = makeStore(() => {
      call += 1;
      return Promise.resolve(call === 1 ? ok(rows) : fail(failure));
    });
    await store.getState().loadSaved();

    await store.getState().loadSaved();

    // A failed refresh must not blank a grid the user is looking at; the reason
    // is what the pull-to-refresh handler reads back to raise its toast.
    expect(store.getState().savedRecipes).toEqual(rows);
    expect(store.getState().listState).toEqual({ status: 'error', failure });
  });

  /**
   * Found in review of the fix above: `Loading` was set on EVERY call, and the
   * screen re-loads all three tabs on focus. So a user with an empty tab saw
   * empty state → skeleton → empty state on every visit, and a pull-to-refresh
   * swapped the ScrollView carrying the RefreshControl out mid-gesture.
   */
  it('stays loaded while a grid that is already on screen reloads', async () => {
    let release!: () => void;
    let call = 0;
    const store = makeStore(async () => {
      call += 1;
      if (call > 1) await new Promise<void>((resolve) => (release = resolve));
      return ok([makeSummary('r1')]);
    });
    await store.getState().loadSaved();

    const reload = store.getState().loadSaved();

    // The frame that used to render a skeleton over rows the user was reading.
    expect(store.getState().listState).toEqual({ status: 'loaded' });
    release();
    await reload;
    expect(store.getState().listState).toEqual({ status: 'loaded' });
  });

  it('discards a response that started before the session ended', async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const store = makeStore(async () => {
      await held;
      return ok([makeSummary('r1')]);
    });

    const inFlight = store.getState().loadSaved();
    // Signing out mid-request: `clearSessionCaches` wipes the store, and the
    // late answer must not put the previous account's saves back — `savedIds`
    // drives the bookmark on every recipe card in the app.
    store.getState().clear();
    release();
    await inFlight;

    expect(store.getState().savedRecipes).toEqual([]);
    expect([...store.getState().savedIds]).toEqual([]);
    expect(store.getState().listState).toEqual({ status: 'idle' });
  });

  it('returns to idle when the session ends, so the next user gets a skeleton', async () => {
    const store = makeStore(() => Promise.resolve(ok([makeSummary('r1')])));
    await store.getState().loadSaved();

    store.getState().clear();

    expect(store.getState().savedRecipes).toEqual([]);
    expect([...store.getState().savedIds]).toEqual([]);
    expect(store.getState().listState).toEqual({ status: 'idle' });
  });
});

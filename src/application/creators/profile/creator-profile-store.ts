import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import { withFollowing } from '@domain/user-profile/with-following';
import { CREATOR_RECIPES_PAGE_SIZE, FIRST_PAGE } from '@infrastructure/constants/api/api-paging';
import type { CreatorProfileStoreState } from '@application/creators/profile/creator-profile-store-state';
import type { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import type { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import type { FollowUserUseCase } from '@application/user-profile/follow/follow-user-use-case';
import type { UnfollowUserUseCase } from '@application/user-profile/follow/unfollow-user-use-case';

interface CreatorProfileStoreDeps {
  getViewedProfile: GetViewedUserProfileUseCase;
  listUserRecipes: ListUserRecipesUseCase;
  follow: FollowUserUseCase;
  unfollow: UnfollowUserUseCase;
}

/**
 * The creator page: one user's profile, their recipes and whether the viewer
 * follows them.
 *
 * @remarks
 * - **One page at a time.** `open` for another user shows skeletons; `open`
 *   for the user already on screen re-reads quietly, which is how a guest who
 *   signed in from the follow prompt comes back to the right button.
 * - **The newest `open` wins.** `generation` is bumped by each one, and any
 *   answer — profile, recipes, next page — from an older one is dropped, so a
 *   slow page for the previous creator never lands on this one. A follow
 *   answer is kept only while the page it was tapped on is still shown: a
 *   same-user re-read keeps that page, `clear` or another user replaces it.
 * - **Follow is optimistic.** The button flips at once through `withFollowing`
 *   and flips back if the server refuses; the refusal is returned for a toast.
 */
export const configureCreatorProfileStore = (deps: CreatorProfileStoreDeps): BoundStore<CreatorProfileStoreState> => {
  let generation = ValueConstants.zero;
  // Bumped only when the page is replaced (another user, or clear): a same-user re-read keeps it.
  let pageShown = ValueConstants.zero;

  return create<CreatorProfileStoreState>((set, get) => {
    const loadProfile = async (userId: string, requested: number): Promise<void> => {
      const result = await deps.getViewedProfile.execute({ userId });
      if (requested !== generation) return;
      if (result.ok) {
        set({ profileState: { status: StoreStatus.Loaded, viewed: result.value } });
      } else if (get().profileState.status !== StoreStatus.Loaded) {
        set({ profileState: { status: StoreStatus.Error, failure: result.failure } });
      }
    };

    const loadFirstRecipes = async (userId: string, requested: number): Promise<void> => {
      const result = await deps.listUserRecipes.execute({ userId, page: FIRST_PAGE, pageSize: CREATOR_RECIPES_PAGE_SIZE });
      if (requested !== generation) return;
      if (result.ok) {
        const { items, page, hasMore } = result.value;
        set({ recipes: items, recipesState: { status: StoreStatus.Loaded, page, hasMore } });
      } else if (get().recipesState.status !== StoreStatus.Loaded) {
        set({ recipesState: { status: StoreStatus.Error, failure: result.failure } });
      }
    };

    const open = async (userId: string): Promise<void> => {
      generation += ValueConstants.one;
      const requested = generation;
      if (get().userId !== userId) {
        pageShown += ValueConstants.one;
        set({
          userId,
          profileState: { status: StoreStatus.Loading },
          recipes: [],
          recipesState: { status: StoreStatus.Loading },
          isFollowPending: false,
        });
      }
      await Promise.all([loadProfile(userId, requested), loadFirstRecipes(userId, requested)]);
    };

    return {
      userId: null,
      profileState: { status: StoreStatus.Idle },
      recipes: [],
      recipesState: { status: StoreStatus.Idle },
      isFollowPending: false,
      open,
      refresh: async () => {
        const { userId } = get();
        if (userId !== null) await open(userId);
      },
      loadMoreRecipes: async () => {
        const { userId, recipesState: current } = get();
        if (userId === null || current.status !== StoreStatus.Loaded || !current.hasMore || current.isLoadingMore === true) {
          return;
        }
        const requested = generation;
        set({ recipesState: { ...current, isLoadingMore: true } });
        const result = await deps.listUserRecipes.execute({
          userId,
          page: current.page + ValueConstants.one,
          pageSize: CREATOR_RECIPES_PAGE_SIZE,
        });
        if (requested !== generation) return;
        if (!result.ok) {
          set({ recipesState: { ...current, isLoadingMore: false } });
          return;
        }
        const known = new Set(get().recipes.map((recipe) => recipe.id));
        set({
          recipes: [...get().recipes, ...result.value.items.filter((recipe) => !known.has(recipe.id))],
          recipesState: { status: StoreStatus.Loaded, page: result.value.page, hasMore: result.value.hasMore },
        });
      },
      toggleFollow: async () => {
        const { profileState, isFollowPending } = get();
        if (profileState.status !== StoreStatus.Loaded || isFollowPending) return null;
        const before = profileState.viewed;
        const following = !before.isFollowedByMe;
        set({ isFollowPending: true, profileState: { status: StoreStatus.Loaded, viewed: withFollowing(before, following) } });
        const input = { userId: before.profile.id };
        const tappedOn = pageShown;
        const result = following ? await deps.follow.execute(input) : await deps.unfollow.execute(input);
        // The page was cleared or replaced since the tap: nothing here is this answer's.
        if (pageShown !== tappedOn) return result.ok ? null : result.failure;
        if (result.ok) {
          set({ isFollowPending: false });
          return null;
        }
        const shown = get().profileState;
        set({
          isFollowPending: false,
          profileState:
            shown.status === StoreStatus.Loaded
              ? { status: StoreStatus.Loaded, viewed: withFollowing(shown.viewed, before.isFollowedByMe) }
              : shown,
        });
        return result.failure;
      },
      clear: () => {
        generation += ValueConstants.one;
        pageShown += ValueConstants.one;
        set({
          userId: null,
          profileState: { status: StoreStatus.Idle },
          recipes: [],
          recipesState: { status: StoreStatus.Idle },
          isFollowPending: false,
        });
      },
    };
  });
};

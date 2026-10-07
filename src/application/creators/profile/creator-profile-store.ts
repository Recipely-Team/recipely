import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import { withFollowing } from '@domain/user-profile/with-following';
import { RequestEpoch } from '@application/store/request-epoch';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { CreatorProfileStoreState } from '@application/creators/profile/creator-profile-store-state';
import type { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import type { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import type { SetFollowingUseCase } from '@application/user-profile/follow/set-following-use-case';

interface CreatorProfileStoreDeps {
  getViewedProfile: GetViewedUserProfileUseCase;
  listUserRecipes: ListUserRecipesUseCase;
  setFollowing: SetFollowingUseCase;
}

/**
 * The creator page: one user's profile, their recipes and whether the viewer
 * follows them.
 *
 * @remarks
 * - **One page at a time.** `open` for another user shows skeletons; `open`
 *   for the user already on screen re-reads quietly, which is how a guest who
 *   signed in from the follow prompt comes back to the right button.
 * - **The newest `open` wins.** Each one starts a profile `RequestEpoch` and a
 *   recipes `PagedListLoader` first page, and any answer — profile, recipes,
 *   next page — from an older one is dropped, so a slow page for the previous
 *   creator never lands on this one. A follow
 *   answer is kept only while the page it was tapped on is still shown: a
 *   same-user re-read keeps that page, `clear` or another user replaces it.
 * - **Follow is optimistic.** The button flips at once through `withFollowing`
 *   and flips back if the server refuses; the refusal is returned for a toast.
 */
export const configureCreatorProfileStore = (deps: CreatorProfileStoreDeps): BoundStore<CreatorProfileStoreState> => {
  const profileEpoch = new RequestEpoch();
  // Bumped only when the page is replaced (another user, or clear): a same-user re-read keeps it.
  let pageShown = ValueConstants.zero;

  return create<CreatorProfileStoreState>((set, get) => {
    const recipes = new PagedListLoader(
      () => get().recipes,
      (list) => set({ recipes: list }),
      (recipe) => recipe.id,
    );

    const loadProfile = async (userId: string): Promise<void> => {
      const isCurrent = profileEpoch.start();
      const result = await deps.getViewedProfile.execute({ userId });
      if (!isCurrent()) return;
      if (result.ok) {
        set({ profileState: { status: StoreStatus.Loaded, viewed: result.value } });
      } else if (get().profileState.status !== StoreStatus.Loaded) {
        set({ profileState: { status: StoreStatus.Error, failure: result.failure } });
      }
    };

    const open = async (userId: string): Promise<void> => {
      const fetchPage = (page: number) => deps.listUserRecipes.execute(userId, page);
      if (get().userId === userId) {
        await Promise.all([loadProfile(userId), recipes.refresh(fetchPage)]);
        return;
      }
      pageShown += ValueConstants.one;
      set({ userId, profileState: { status: StoreStatus.Loading }, isFollowPending: false });
      await Promise.all([loadProfile(userId), recipes.load(fetchPage)]);
    };

    return {
      userId: null,
      profileState: { status: StoreStatus.Idle },
      recipes: { status: StoreStatus.Idle },
      isFollowPending: false,
      open,
      refresh: async () => {
        const { userId } = get();
        if (userId !== null) await open(userId);
      },
      loadMoreRecipes: () => recipes.loadMore(),
      toggleFollow: async () => {
        const { profileState, isFollowPending } = get();
        if (profileState.status !== StoreStatus.Loaded || isFollowPending) return null;
        const before = profileState.viewed;
        const following = !before.isFollowedByMe;
        set({ isFollowPending: true, profileState: { status: StoreStatus.Loaded, viewed: withFollowing(before, following) } });
        const tappedOn = pageShown;
        const result = await deps.setFollowing.execute(before.profile.id, following);
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
        profileEpoch.invalidate();
        pageShown += ValueConstants.one;
        recipes.reset();
        set({ userId: null, profileState: { status: StoreStatus.Idle }, isFollowPending: false });
      },
    };
  });
};

import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { RequestEpoch } from '@application/store/request-epoch';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { LikedRecipesStore } from '@application/recipes/liked/liked-recipes-store-contract';
import { pagingOf } from '@application/store/paging/list-paging/paging-of';
import { NO_PAGING } from '@application/store/paging/list-paging/no-paging';
import { loadMorePaging } from '@application/store/paging/list-paging/load-more-paging';
import { pagingAfterRemoval } from '@application/store/paging/list-paging/paging-after-removal';
import { appendById } from '@application/store/paging/append-by-id';


interface LikedRecipesStoreDeps {
  loadLikedRecipesUseCase: LoadLikedRecipesUseCase;
}

export const configureLikedRecipesStore = (
  deps: LikedRecipesStoreDeps,
): BoundStore<LikedRecipesStore> => {
  /**
   * Invalidated by `clear()`; a newer load also wins. A load that started under
   * an earlier session must not publish its answer: signing out while the
   * request was in flight would repopulate the previous account's rows.
   */
  const epoch = new RequestEpoch();

  return create<LikedRecipesStore>((set, get) => ({
    likedRecipes: [],
    listState: { status: StoreStatus.Idle },
    paging: NO_PAGING,
    setLiked: (page) => set({ likedRecipes: page.items, listState: { status: StoreStatus.Loaded }, paging: pagingOf(page) }),
    loadMoreLiked: () => {
      const isCurrent = epoch.current();
      return loadMorePaging({
        read: () => get().paging,
        write: (paging) => set({ paging }),
        fetch: (page) => deps.loadLikedRecipesUseCase.execute(page),
        isCurrent,
        append: (items) => set((s) => ({ likedRecipes: appendById(s.likedRecipes, items) })),
      });
    },
    removeLocal: (id) =>
      set((s) => {
        if (!s.likedRecipes.some((r) => r.id === id)) return s;
        return { likedRecipes: s.likedRecipes.filter((r) => r.id !== id), paging: pagingAfterRemoval(s.paging) };
      }),
    loadLiked: async () => {
      const isCurrent = epoch.start();
      // Only the first load shows a skeleton.
      if (get().listState.status !== StoreStatus.Loaded) {
        set({ listState: { status: StoreStatus.Loading } });
      }
      const result = await deps.loadLikedRecipesUseCase.execute();
      if (!isCurrent()) return result;
      if (!result.ok) {
        // A failed reload keeps the rows; a next page it superseded is no longer on its way.
        set((s) => ({ listState: { status: StoreStatus.Error, failure: result.failure }, paging: { ...s.paging, isLoadingMore: false } }));
        return result;
      }
      get().setLiked(result.value);
      return result;
    },
    clear: () => {
      epoch.invalidate();
      set({ likedRecipes: [], listState: { status: StoreStatus.Idle }, paging: NO_PAGING });
    },
  }));
};

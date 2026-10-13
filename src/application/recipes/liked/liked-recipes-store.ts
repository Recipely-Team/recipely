import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { RequestEpoch } from '@application/store/request-epoch';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import { pagingOf } from '@application/store/paging/paging-of';
import { NO_PAGING } from '@application/store/paging/no-paging';
import { appendById } from '@application/store/paging/append-by-id';
import { ValueConstants } from '@core/constants';


interface LikedRecipesStoreDeps {
  loadLikedRecipesUseCase: LoadLikedRecipesUseCase;
}

export const configureLikedRecipesStore = (
  deps: LikedRecipesStoreDeps,
): BoundStore<LikedRecipesStoreState> => {
  /**
   * Invalidated by `clear()`; a newer load also wins. A load that started under
   * an earlier session must not publish its answer: signing out while the
   * request was in flight would repopulate the previous account's rows.
   */
  const epoch = new RequestEpoch();

  return create<LikedRecipesStoreState>((set, get) => ({
    likedRecipes: [],
    listState: { status: StoreStatus.Idle },
    paging: NO_PAGING,
    setLiked: (page) => set({ likedRecipes: page.items, listState: { status: StoreStatus.Loaded }, paging: pagingOf(page) }),
    loadMoreLiked: async () => {
      const { paging } = get();
      if (!paging.hasMore || paging.isLoadingMore) return;
      const isCurrent = epoch.current();
      set({ paging: { ...paging, isLoadingMore: true } });
      const result = await deps.loadLikedRecipesUseCase.execute(paging.page + ValueConstants.one);
      if (!isCurrent()) return;
      if (!result.ok) {
        set((s) => ({ paging: { ...s.paging, isLoadingMore: false } }));
        return;
      }
      set((s) => ({ likedRecipes: appendById(s.likedRecipes, result.value.items), paging: pagingOf(result.value) }));
    },
    removeLocal: (id) =>
      set((s) => {
        if (!s.likedRecipes.some((r) => r.id === id)) return s;
        return { likedRecipes: s.likedRecipes.filter((r) => r.id !== id), paging: { ...s.paging, total: Math.max(ValueConstants.zero, s.paging.total - ValueConstants.one) } };
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
        // A failed reload keeps the rows.
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
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

import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { RequestEpoch } from '@application/store/request-epoch';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';

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
    setLiked: (recipes) => set({ likedRecipes: recipes, listState: { status: StoreStatus.Loaded } }),
    removeLocal: (id) =>
      set((s) => {
        if (!s.likedRecipes.some((r) => r.id === id)) return s;
        return { likedRecipes: s.likedRecipes.filter((r) => r.id !== id) };
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
      set({ likedRecipes: [], listState: { status: StoreStatus.Idle } });
    },
  }));
};

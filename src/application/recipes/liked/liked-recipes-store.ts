import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';

interface LikedRecipesStoreDeps {
  loadLikedRecipesUseCase: LoadLikedRecipesUseCase;
}

export const configureLikedRecipesStore = (
  deps: LikedRecipesStoreDeps,
): BoundStore<LikedRecipesStoreState> => {
  /**
   * Bumped by `clear()`. A load that started under an earlier session must not
   * publish its answer: signing out while the request was in flight would
   * repopulate the previous account's rows.
   */
  let session = ValueConstants.zero;

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
      const requested = session;
      // Only the FIRST load announces itself: a reload of a grid already on
      // screen keeps its `Loaded` state, or every re-focus — and every
      // pull-to-refresh — would swap the rows for a skeleton.
      if (get().listState.status !== StoreStatus.Loaded) {
        set({ listState: { status: StoreStatus.Loading } });
      }
      const result = await deps.loadLikedRecipesUseCase.execute();
      if (requested !== session) return result;
      if (!result.ok) {
        // The rows already on screen stay: a failed reload must not blank the
        // grid the user is looking at.
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
        return result;
      }
      get().setLiked(result.value);
      return result;
    },
    clear: () => {
      session += ValueConstants.one;
      set({ likedRecipes: [], listState: { status: StoreStatus.Idle } });
    },
  }));
};

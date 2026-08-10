import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';

interface RecipeDetailStoreDeps {
  getRecipe: GetRecipeUseCase;
}

export const configureRecipeDetailStore = (deps: RecipeDetailStoreDeps): BoundStore<RecipeDetailStoreState> => {
  return create<RecipeDetailStoreState>((set, get) => ({
    byId: {},
    load: async (id: string) => {
      // A re-entry refetches, and the cached recipe stays on screen while it
      // does — dropping back to `loading` would blank a screen the user has
      // already seen, for a request that usually changes nothing.
      const cached = get().byId[id];
      if (cached?.status !== StoreStatus.Loaded) {
        set({ byId: { ...get().byId, [id]: { status: StoreStatus.Loading } } });
      }
      const result = await deps.getRecipe.execute(id);
      if (!result.ok) {
        // A failed refresh must not throw away a recipe already on screen.
        if (cached?.status !== StoreStatus.Loaded) {
          set({
            byId: { ...get().byId, [id]: { status: StoreStatus.Error, failure: result.failure } },
          });
        }
        return;
      }
      set({
        byId: {
          ...get().byId,
          [id]: { status: StoreStatus.Loaded, recipe: result.value, fetchedAt: Date.now() },
        },
      });
    },
    remove: (id) =>
      set((s) => {
        if (s.byId[id] === undefined) return s;
        const next = { ...s.byId };
        delete next[id];
        return { byId: next };
      }),
    clear: () => set({ byId: {} }),
  }));
};

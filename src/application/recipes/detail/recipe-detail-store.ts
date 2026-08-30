import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import type { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import type { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';

interface RecipeDetailStoreDeps {
  getRecipe: GetRecipeUseCase;
  addRecipePhoto: AddRecipePhotoUseCase;
  removeRecipePhoto: RemoveRecipePhotoUseCase;
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
    isPhotoBusy: false,

    addPhoto: async (recipeId, fileUri, fileName, mimeType) => {
      set({ isPhotoBusy: true });
      const result = await deps.addRecipePhoto.execute(recipeId, fileUri, fileName, mimeType);
      set({ isPhotoBusy: false });
      if (!result.ok) return result.failure;

      // Reload rather than append: the gallery renders from the loaded recipe,
      // and a second copy of the truth is a second thing to keep right.
      await get().load(recipeId);
      return null;
    },

    removePhoto: async (recipeId, mediaId) => {
      set({ isPhotoBusy: true });
      const result = await deps.removeRecipePhoto.execute(recipeId, mediaId);
      set({ isPhotoBusy: false });
      if (!result.ok) return result.failure;

      await get().load(recipeId);
      return null;
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

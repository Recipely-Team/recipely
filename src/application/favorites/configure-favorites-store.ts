import { create } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { FavoritesStoreState } from '@application/favorites/favorites-store-state';
import type { ConfigureFavoritesStoreOptions } from '@application/favorites/configure-favorites-store-options';
import type { FavoritesStore } from '@application/favorites/favorites-store';

export const configureFavoritesStore = (deps: ConfigureFavoritesStoreOptions): FavoritesStore => {
  const { addFavoriteUseCase, removeFavoriteUseCase, savedRecipesStore } = deps;

  return create<FavoritesStoreState>((set) => ({
    isLoading: false,
    error: null,
    addFavorite: async (userId: string, recipeId: string) => {
      try {
        set({ isLoading: true, error: null });
        const result = await addFavoriteUseCase.execute(userId, recipeId);
        if (!result.ok) {
          set({ isLoading: false, error: result.failure });
          return;
        }
        savedRecipesStore.getState().addLocal(recipeId);
        set({ isLoading: false });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        set({ isLoading: false, error: new UnknownFailure(errorMsg) });
      }
    },
    removeFavorite: async (userId: string, recipeId: string) => {
      try {
        set({ isLoading: true, error: null });
        const result = await removeFavoriteUseCase.execute(userId, recipeId);
        if (!result.ok) {
          set({ isLoading: false, error: result.failure });
          return;
        }
        savedRecipesStore.getState().removeLocal(recipeId);
        set({ isLoading: false });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        set({ isLoading: false, error: new UnknownFailure(errorMsg) });
      }
    },
    clearError: () => set({ error: null }),
  }));
};

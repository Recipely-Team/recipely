import { ValueConstants } from '@core/constants';
import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import { UnknownFailure } from '@core/failure';
import type { FavoritesStoreState } from '@application/favorites/favorites-store-state';
import type { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import type { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

interface FavoritesStoreDeps {
  addFavoriteUseCase: AddFavoriteUseCase;
  removeFavoriteUseCase: RemoveFavoriteUseCase;
  savedRecipesStore: BoundStore<SavedRecipesStoreState>;
}

export const configureFavoritesStore = (deps: FavoritesStoreDeps): BoundStore<FavoritesStoreState> => {
  const { addFavoriteUseCase, removeFavoriteUseCase, savedRecipesStore } = deps;

  return create<FavoritesStoreState>((set, get) => {
    const begin = (recipeId: string): boolean => {
      if (get().pending.has(recipeId)) return false;
      const pending = new Set(get().pending).add(recipeId);
      set({ pending, isLoading: true, error: null });
      return true;
    };
    const end = (recipeId: string, error: FavoritesStoreState['error'] = null): void => {
      const pending = new Set(get().pending);
      pending.delete(recipeId);
      set({ pending, isLoading: pending.size > ValueConstants.zero, ...(error === null ? {} : { error }) });
    };
    return {
    isLoading: false,
    pending: new Set<string>(),
    error: null,
    addFavorite: async (userId: string, recipeId: string) => {
      if (!begin(recipeId)) return;
      try {
        const result = await addFavoriteUseCase.execute(userId, recipeId);
        if (!result.ok) {
          end(recipeId, result.failure);
          return;
        }
        savedRecipesStore.getState().addLocal(recipeId);
        end(recipeId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        end(recipeId, new UnknownFailure(errorMsg));
      }
    },
    removeFavorite: async (userId: string, recipeId: string) => {
      if (!begin(recipeId)) return;
      try {
        const result = await removeFavoriteUseCase.execute(userId, recipeId);
        if (!result.ok) {
          end(recipeId, result.failure);
          return;
        }
        savedRecipesStore.getState().removeLocal(recipeId);
        end(recipeId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        end(recipeId, new UnknownFailure(errorMsg));
      }
    },
    clearError: () => set({ error: null }),
    };
  });
};

import { useCallback } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import type { UseSaveRecipeResult } from '@presentation/base/hooks/recipes/use-save-recipe-result';

/**
 * Shared favorites wiring for the web recipe cards and hero card. Reads the
 * saved set from `savedRecipesStore` and drives `favoritesStore` with the
 * authenticated user id, surfacing a rejected save as a toast. Keeps the
 * presentation layer free of any infrastructure dependency.
 */
export const useSaveRecipe = (): UseSaveRecipeResult => {
  const { savedRecipesStore, favoritesStore, authStore } = useStores();
  const savedIds = savedRecipesStore((s) => s.savedIds);
  const authState = authStore((s) => s.state);
  const userId = authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;

  const isSaved = useCallback((recipeId: string): boolean => savedIds.has(recipeId), [savedIds]);

  const toggleSave = useCallback(
    async (recipeId: string): Promise<void> => {
      const favorites = favoritesStore.getState();
      if (favorites.isLoading || userId === null) return;
      if (savedRecipesStore.getState().savedIds.has(recipeId)) {
        await favorites.removeFavorite(userId, recipeId);
      } else {
        await favorites.addFavorite(userId, recipeId);
      }
      const failure = favoritesStore.getState().error;
      if (failure !== null) {
        showErrorToast(failure);
        favoritesStore.getState().clearError();
      }
    },
    [favoritesStore, savedRecipesStore, userId],
  );

  return { isSaved, toggleSave };
};

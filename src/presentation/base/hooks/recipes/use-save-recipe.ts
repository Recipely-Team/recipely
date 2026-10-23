import { useCallback } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { useTranslations } from '@presentation/i18n';
import type { UseSaveRecipeResult } from '@presentation/base/hooks/recipes/use-save-recipe-result';
import { useSignedInUserId } from '@presentation/base/hooks/auth/use-signed-in-user-id';

/**
 * Shared favorites wiring for the recipe cards and hero card. Reads the
 * saved set from `savedRecipesStore` and drives `favoritesStore` with the
 * authenticated user id, surfacing a rejected save as a toast.
 *
 * @remarks
 * - **Each recipe is guarded on its own** (`favoritesStore.pending`): a tap on
 *   one card while another card's save is on its way is not dropped.
 * - **Unsaving offers Undo** — on the Saved tab the card vanishes at once.
 */
export const useSaveRecipe = (): UseSaveRecipeResult => {
  const t = useTranslations();
  const { savedRecipesStore, favoritesStore } = useStores();
  const userId = useSignedInUserId();

  const toggleSave = useCallback(
    async (recipeId: string): Promise<void> => {
      const favorites = favoritesStore.getState();
      if (favorites.pending.has(recipeId) || userId === null) return;
      const wasSaved = savedRecipesStore.getState().savedIds.has(recipeId);
      const failure = wasSaved
        ? await favorites.removeFavorite(userId, recipeId)
        : await favorites.addFavorite(userId, recipeId);
      if (failure !== null) {
        showErrorToast(failure);
        return;
      }
      if (wasSaved) {
        toastStore.getState().show({
          severity: SeverityType.Neutral,
          message: t.recipes.removedFromSaved,
          actionLabel: t.common.undo,
          onAction: () => {
            void favoritesStore.getState().addFavorite(userId, recipeId).then((undoFailure) => {
              if (undoFailure !== null) showErrorToast(undoFailure);
            });
          },
        });
      }
    },
    [favoritesStore, savedRecipesStore, userId, t],
  );

  return { toggleSave };
};

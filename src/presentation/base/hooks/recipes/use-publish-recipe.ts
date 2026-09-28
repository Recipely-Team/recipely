import { useCallback } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';
import type { Failure } from '@core/failure';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import { ownerStatusToast } from '@presentation/base/hooks/recipes/owner-status-toast';
import type { UsePublishRecipeResult } from '@presentation/base/hooks/recipes/use-publish-recipe-result';

/**
 * Publishing and unpublishing a recipe the user owns, from any screen.
 *
 * @remarks
 * - **Two screens ask for it.** The owner's status panel on the detail page,
 *   and the editor, whose assistant "publish" now means save, then publish.
 * - **The toast reads the recipe, not the request.** The store writes the
 *   moderator's answer into the detail cache, and the panel and the toast both
 *   read `ownerStatus` from there — so they can never disagree.
 * - **A rejection is not a success.** It lands as a caution, since the recipe
 *   stays private for good.
 */
export const usePublishRecipe = (): UsePublishRecipeResult => {
  const { recipePublishingStore, recipeDetailStore } = useStores();
  const isBusy = recipePublishingStore((s) => s.isBusy);

  const announce = useCallback(
    (recipeId: string, failure: Failure | null): void => {
      if (failure !== null) {
        showErrorToast(failure);
        return;
      }
      const entry = recipeDetailStore.getState().byId[recipeId];
      if (entry?.status !== StoreStatus.Loaded) return;
      const status = entry.recipe.ownerStatus;
      if (status === OwnerStatus.Rejected) showWarningToast(ownerStatusToast[status]());
      else showSuccessToast(ownerStatusToast[status]());
    },
    [recipeDetailStore],
  );

  const publish = useCallback(
    async (recipeId: string): Promise<void> => {
      announce(recipeId, await recipePublishingStore.getState().publish(recipeId));
    },
    [announce, recipePublishingStore],
  );

  const unpublish = useCallback(
    async (recipeId: string): Promise<void> => {
      announce(recipeId, await recipePublishingStore.getState().unpublish(recipeId));
    },
    [announce, recipePublishingStore],
  );

  return { publish, unpublish, isBusy };
};

import { useCallback, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { useStores } from '@presentation/bootstrap/use-stores';
import { usePublishRecipe } from '@presentation/base/hooks/recipes/use-publish-recipe';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';
import {
  PanelConfirm,
  type PanelConfirmType,
} from '@presentation/app/recipes/[recipeId]/model/publishing/panel-confirm';
import type { UseOwnerStatusPanelResult } from '@presentation/app/recipes/[recipeId]/model/publishing/use-owner-status-panel-result';

/**
 * Drives the owner's status panel on a recipe's page.
 *
 * @remarks
 * - **Every rule is the entity's.** Status, blockers and whether Publish is
 *   allowed are `RecipeEntity` getters; this hook only turns taps into
 *   requests and asks before either publish or unpublish goes out.
 * - **The panel redraws from the cache.** Publish, unpublish and cover removal
 *   write the server's answer into the detail store the screen renders from.
 */
export const useOwnerStatusPanel = (recipe: RecipeEntity): UseOwnerStatusPanelResult => {
  const router = useRouter();
  const { recipeDetailStore } = useStores();
  const removePhoto = recipeDetailStore((s) => s.removePhoto);
  const isPhotoBusy = recipeDetailStore((s) => s.isPhotoBusy);
  const { publish, unpublish, isBusy } = usePublishRecipe();
  const [confirm, setConfirm] = useState<PanelConfirmType | null>(null);
  const cover = recipe.media.find((item) => recipe.isCover(item));

  const onConfirm = useCallback((): void => {
    const asked = confirm;
    setConfirm(null);
    if (asked === PanelConfirm.Publish) void publish(recipe.id);
    if (asked === PanelConfirm.Unpublish) void unpublish(recipe.id);
  }, [confirm, publish, unpublish, recipe.id]);

  const onRemoveCover = useCallback((): void => {
    if (cover === undefined) return;
    void (async () => {
      const failure = await removePhoto(recipe.id, cover);
      if (failure !== null) showErrorToast(failure);
      else showSuccessToast(t().publishing.sitePhotoRemoved);
    })();
  }, [cover, removePhoto, recipe.id]);

  return {
    status: recipe.ownerStatus,
    blockers: recipe.publishBlockers,
    canPublish: recipe.canPublish,
    hasCover: cover !== undefined,
    isBusy: isBusy || isPhotoBusy,
    confirm,
    onRequestPublish: () => setConfirm(PanelConfirm.Publish),
    onRequestUnpublish: () => setConfirm(PanelConfirm.Unpublish),
    onConfirm,
    onCancelConfirm: () => setConfirm(null),
    onEdit: () => router.push(RoutePaths.editRecipe(recipe.id) as Href),
    onRemoveCover,
  };
};

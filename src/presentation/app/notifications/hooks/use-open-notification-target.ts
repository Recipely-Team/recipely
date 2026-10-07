import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';
import { NotificationTargetKind } from '@domain/notifications/notification-target-kind';
import type { NotificationTargetType } from '@domain/notifications/notification-target';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Opens what a notification points at.
 *
 * @remarks
 * - **A draft** (an import that produced something to finish) opens the editor
 *   the same way My Recipes does, so a resumed import and a resumed draft are
 *   the same screen in the same state.
 * - **A creator-claim decision** opens Edit Profile at the creator account,
 *   where the claim lives.
 * - **A recipe or comment** opens the recipe; a comment target scrolls to it.
 *   The cast: a dynamic recipe path can't be checked against expo-router's
 *   typed-routes union — same as `useRecipeDetail`.
 */
export function useOpenNotificationTarget(): (target: NotificationTargetType) => void {
  const router = useRouter();
  return useCallback(
    (target: NotificationTargetType): void => {
      if (target.kind === NotificationTargetKind.Draft) {
        router.push({ pathname: RoutePaths.createRecipe, params: { draftId: target.draftId } });
        return;
      }
      if (target.kind === NotificationTargetKind.CreatorAccount) {
        router.push(RoutePaths.editProfileCreatorAccount as Href);
        return;
      }
      router.push(
        (target.kind === NotificationTargetKind.Comment
          ? RoutePaths.recipeComment(target.recipeId, target.commentId)
          : RoutePaths.recipeDetail(encodeURIComponent(target.recipeId))) as Href,
      );
    },
    [router],
  );
}

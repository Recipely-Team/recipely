import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type * as NotificationsType from 'expo-notifications';
import { type Href, useRouter } from 'expo-router';
import { isWeb } from '@infrastructure/constants/platform';
import { isString } from '@core/guards/type-guards';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Keys the backend puts in the FCM data payload. Mirrors
 * `NotificationService.notify` in recipely-backend.
 */
const DataKey = {
  Type: 'type',
  DraftId: 'draftId',
  RecipeId: 'recipeId',
  CommentId: 'commentId',
} as const;

/** Timer notifications carry their own handler; this one must not steal them. */
const TIMER_TYPE_PREFIX = 'timer';

const readString = (data: Record<string, unknown> | undefined, key: string): string | null => {
  const value = data?.[key];
  return isString(value) && value.length > 0 ? value : null;
};

/**
 * Opens what a tapped push notification points at.
 *
 * @remarks
 * - **Why this is separate from the notifications SCREEN.** That screen routes
 *   taps on rows the user is already looking at. This handles the far more
 *   common case: the phone was in a pocket, the banner said "Your recipe is
 *   ready", and the tap arrived from the system tray. Without it the app
 *   opened on whatever screen it was last on, and the one action the
 *   notification exists to offer was the one it could not perform.
 * - **Cold and warm start both.** A notification that launched the app is not
 *   delivered to the listener — it is waiting in
 *   `getLastNotificationResponseAsync`. Handling only the listener would work
 *   for a running app and silently do nothing for a killed one, which is
 *   exactly the case a background import is most likely to hit.
 * - **Ordering with the auth guard.** Routing to a gated path while signed out
 *   is safe: the guard bounces to login carrying this destination as its
 *   redirect, so the user lands here after signing in rather than nowhere.
 * - **Timer notifications are left alone.** They have their own handler with
 *   an action button and an alarm screen; matching on the backend's `type`
 *   values only keeps the two from fighting over the same tap.
 */
export const usePushNotificationTap = (): void => {
  const router = useRouter();

  useEffect(() => {
    if (isWeb()) return;

    const handle = (response: NotificationsType.NotificationResponse | null): void => {
      if (response === null) return;
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;

      const type = readString(data, DataKey.Type);
      if (type === null || type.startsWith(TIMER_TYPE_PREFIX)) return;

      // Checked first because it is the one target with no recipe behind it:
      // a finished import produced something to finish, not something to read.
      const draftId = readString(data, DataKey.DraftId);
      if (draftId !== null) {
        router.push({ pathname: RoutePaths.createRecipe, params: { draftId } });
        return;
      }

      const recipeId = readString(data, DataKey.RecipeId);
      if (recipeId === null) return;
      const path = RoutePaths.recipeDetail(encodeURIComponent(recipeId));
      const commentId = readString(data, DataKey.CommentId);
      // Cast: a dynamic path cannot be statically verified against
      // expo-router's typed-routes union — same pattern as the notifications
      // screen next door.
      router.push(
        (commentId !== null ? `${path}?commentId=${encodeURIComponent(commentId)}` : path) as Href,
      );
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    void (
      Notifications.getLastNotificationResponseAsync() as Promise<NotificationsType.NotificationResponse | null>
    ).then(handle);

    return () => sub.remove();
  }, [router]);
};

import type { NotificationTargetKind } from '@domain/notifications/notification-target-kind';
/**
 * Where tapping a `Notification` should navigate. Derived by
 * `Notification.target`; `null` means the notification has no destination
 * (e.g. a follow notification, which carries no `recipeId`).
 */
export type NotificationTarget =
  | { readonly kind: typeof NotificationTargetKind.Recipe; readonly recipeId: string }
  | {
      readonly kind: typeof NotificationTargetKind.Comment;
      readonly recipeId: string;
      readonly commentId: string;
    }
  | { readonly kind: typeof NotificationTargetKind.Draft; readonly draftId: string };

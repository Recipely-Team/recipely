import type { NotificationTargetKind } from '@domain/notifications/notification-target-kind';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
/**
 * Where tapping a `Notification` should navigate. Derived by
 * `Notification.target`; `null` means the notification has no destination
 * (e.g. a follow notification, which carries no `recipeId`).
 */
export type NotificationTargetType =
  | { readonly kind: typeof NotificationTargetKind.Recipe; readonly recipeId: string }
  | {
      readonly kind: typeof NotificationTargetKind.Comment;
      readonly recipeId: string;
      readonly commentId: string;
    }
  | { readonly kind: typeof NotificationTargetKind.Draft; readonly draftId: string }
  | { readonly kind: typeof NotificationTargetKind.CreatorAccount; readonly platform: CreatorPlatformType };

/**
 * Where tapping a `Notification` should navigate. Derived by
 * `Notification.target`; `null` means the notification has no destination
 * (e.g. a follow notification, which carries no `recipeId`).
 */
export type NotificationTarget =
  | { readonly kind: 'recipe'; readonly recipeId: string } // TO DO: static kind name problem
  | { readonly kind: 'comment'; readonly recipeId: string; readonly commentId: string }; // TO DO: static kind name problem

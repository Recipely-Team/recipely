/**
 * Why a reply was not sent (backend #374). Failed sends are never retried.
 * Also the wire values.
 */
export const DmSendReason = {
  TooOld: 'too_old',
  RecipeUnavailable: 'recipe_unavailable',
  NotConnected: 'not_connected',
  RateLimited: 'rate_limited',
  PermissionMissing: 'permission_missing',
  RecipientUnavailable: 'recipient_unavailable',
  UpstreamError: 'upstream_error',
} as const;

export type DmSendReasonType = (typeof DmSendReason)[keyof typeof DmSendReason];

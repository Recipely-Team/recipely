/** How the Instagram login came back to the app. */
export const InstagramReturnKind = {
  /** Logged in: a one-time code to finish linking with. */
  Authorized: 'authorized',
  /** The user said no on Instagram's page. */
  Denied: 'denied',
  /** Instagram or the server could not complete the login. */
  Failed: 'failed',
  /** The user closed the login before it finished. */
  Cancelled: 'cancelled',
} as const;

export type InstagramReturnKindType = (typeof InstagramReturnKind)[keyof typeof InstagramReturnKind];

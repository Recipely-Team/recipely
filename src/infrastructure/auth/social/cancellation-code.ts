/**
 * The codes a sign-in SDK throws to say "the user backed out".
 *
 * @remarks
 * - **One list, both platform builds.** `social-auth-provider.ts` and its
 *   `.web.ts` twin ask the same question of different SDKs, so the answer is
 *   written down once (rule 13).
 * - **Google is absent on purpose.** Its native module publishes its own
 *   vocabulary (`statusCodes.SIGN_IN_CANCELLED`, whose value differs per
 *   platform), so the provider compares against theirs rather than re-spelling
 *   it here.
 * - **These strings decide whether the screen stays silent.** A typo in one
 *   shows "something went wrong" to someone who only closed a sheet — which is
 *   the bug this file exists to prevent.
 */
export const CancellationCode = {
  /** expo-apple-authentication rejects with this when the Apple sheet is dismissed. */
  appleRequestCanceled: 'ERR_REQUEST_CANCELED',
  /** Firebase web: the user closed the OAuth popup. */
  firebasePopupClosed: 'auth/popup-closed-by-user',
  /** Firebase web: a second popup superseded this one (double tap on the button). */
  firebasePopupSuperseded: 'auth/cancelled-popup-request',
  /** Firebase web: the user refused at the provider's consent screen. */
  firebaseUserCancelled: 'auth/user-cancelled',
} as const;

/**
 * Asks the composition root to (re-)register this device for push.
 *
 * @remarks
 * - **Why a mutable handler and not a call.** Fetching the token is
 *   platform-specific and lives in infrastructure, which presentation may not
 *   import. The composition root wires the real thing in; this is the same seam
 *   `app-bootstrap` already uses for `onSessionExpired`, and for the same
 *   chicken-and-egg reason.
 * - **Why it can be asked for again.** Registration runs once at startup, and
 *   it gives up silently when notification permission has not been granted. A
 *   user who grants permission later — which is exactly what "notify me" now
 *   asks them to do — would otherwise have no token until the next cold start,
 *   so the promise on screen would stay unkept for the whole session.
 * - **Fire and forget.** Every caller is UI with something better to do, and a
 *   device that cannot register is a device that shows the result in the app
 *   instead. Nothing here is worth blocking or failing a screen for.
 */
let handler: () => void = () => {};

/** Called by the composition root once the real registration is available. */
export const setPushRegistrationHandler = (fn: () => void): void => {
  handler = fn;
};

/** Requests permission if needed and registers the token — safe to call again. */
export const ensurePushRegistration = (): void => {
  handler();
};

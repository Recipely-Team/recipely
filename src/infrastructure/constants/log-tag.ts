/**
 * The prefixes dev-only log lines are tagged with, so a console filter picks
 * out one transport or subsystem.
 *
 * @remarks
 * - **The arrows are the direction of travel** — `→` is a request leaving,
 *   `←` a response arriving. They were typed out at every call site, which is
 *   how `[HTTP ←]` and `[HTTP ← multipart]` ended up as two unrelated strings
 *   that a filter for one would not catch.
 * - **Every line these tag sits behind `__DEV__`** (rule 22); nothing here
 *   reaches a release build.
 */
export const LogTag = {
  httpRequest: '[HTTP →]',
  httpResponse: '[HTTP ←]',
  multipartRequest: '[HTTP → multipart]',
  multipartResponse: '[HTTP ← multipart]',
  secureTokenStorage: '[SecureTokenStorage]',
  firebaseInitWeb: '[firebase-init.web]',
  pushTokenRegistrar: '[push-token-registrar]',
} as const;

/** Suffix shared by the two transports' decrypt-failure lines. */
export const DECRYPT_FAILED_LOG = 'decrypt failed:';

/** What the dev-only warnings say, so the wording is not retyped per call site. */
export const LogMessage = {
  firebaseEnvMissing: 'EXPO_PUBLIC_FIREBASE_* env vars missing — skipping init',
  analyticsInitSkipped: 'analytics init skipped:',
  vapidKeyMissing: 'EXPO_PUBLIC_FIREBASE_VAPID_KEY missing — skipping web push registration',
  deviceTokenRejected: 'backend rejected device token:',
  androidPushSkipped: 'android push registration skipped:',
} as const;

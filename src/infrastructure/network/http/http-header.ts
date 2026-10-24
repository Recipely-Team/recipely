/**
 * The HTTP header names and values this client sets, and the auth scheme it
 * sends them under.
 *
 * @remarks
 * - **Spelling is load-bearing and was duplicated.** `Content-Type` was written
 *   in two interceptor branches and `Accept` in the uploader, each independently;
 *   a header name is a string the compiler cannot check, so a typo here fails at
 *   runtime against the backend rather than at build time.
 * - **`bearer` carries its trailing space** so a token is never concatenated
 *   without one — the bug that shape prevents is invisible in review.
 */
export const HttpHeader = {
  acceptLanguage: 'Accept-Language',
  authorization: 'Authorization',
  contentType: 'Content-Type',
  accept: 'Accept',
  /** Asks the API to deliver the refresh token as an HttpOnly cookie (web). */
  recipelySession: 'X-Recipely-Session',
  /** One id per request, logged by the API too, so an app failure can be found in the server log. */
  requestId: 'X-Request-Id',
  /** The Play Integrity token or the App Attest assertion for this request. */
  appAttestation: 'X-App-Attestation',
  /** Which attestation `X-App-Attestation` holds: `android` or `ios`. */
  appAttestationPlatform: 'X-App-Attestation-Platform',
  /** iOS only: the registered App Attest key the assertion was signed with. */
  appAttestationKey: 'X-App-Attestation-Key',
} as const;

/** Header values this client sends. */
export const HttpMediaType = {
  json: 'application/json',
  /** The `X-Recipely-Session` value for cookie delivery. */
  cookieSession: 'cookie',
} as const;

/** The `Authorization` scheme prefix, trailing space included. */
export const BEARER_PREFIX = 'Bearer ';

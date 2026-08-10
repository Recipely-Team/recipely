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
} as const;

/** Header values this client sends. */
export const HttpMediaType = {
  json: 'application/json',
} as const;

/** The `Authorization` scheme prefix, trailing space included. */
export const BEARER_PREFIX = 'Bearer ';

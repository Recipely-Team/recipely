/**
 * The `error.code` values recipely-backend puts on the wire.
 *
 * @remarks
 * - **Wider than the client's own vocabulary.** Several of these narrow onto a
 *   single `FailureCode`: `unprocessable` joins `validation`,
 *   `too_many_requests` joins `rate_limit`, `internal` joins `server`. That
 *   narrowing happens in `failureFromResponse` and nowhere else.
 * - **Owned by the backend.** Adding one here without the backend sending it
 *   achieves nothing; the two repositories ship independently, so check the
 *   backend's error catalogue before extending this list.
 */
export const ApiErrorCode = {
  Validation: 'validation',
  Unprocessable: 'unprocessable',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  Conflict: 'conflict',
  RateLimit: 'rate_limit',
  TooManyRequests: 'too_many_requests',
  Server: 'server',
  Internal: 'internal',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

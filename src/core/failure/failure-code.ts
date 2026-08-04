/**
 * The coarse discriminator every `Failure` subtype carries.
 *
 * @remarks
 * - **Why it is a closed union.** This same vocabulary is written down in three
 *   places — the failure classes that declare it, the infrastructure mapper
 *   that produces them from a response, and the presentation table that turns
 *   one into user copy. While `Failure.code` was a bare `string`, a typo in any
 *   of the three compiled and simply fell through to the "unknown" copy at
 *   runtime. Typing it here makes the presentation table exhaustive, so adding
 *   a code without giving it copy is a compile error.
 * - **Not every code is an error.** `Cancelled` says the user ended the flow
 *   themselves. It travels here because the operation produced no value, but a
 *   screen must read it as "say nothing" — see `CancelledFailure`.
 * - **Not the backend's vocabulary.** The wire codes are a separate, larger set
 *   (`unprocessable`, `too_many_requests`, `internal`, …) and live in
 *   `@infrastructure/constants/api-error-code`. Several of them map onto one
 *   code here; that narrowing is the mapper's job.
 */
export const FailureCode = {
  Validation: 'validation',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  Conflict: 'conflict',
  RateLimit: 'rate_limit',
  Server: 'server',
  Network: 'network',
  Timeout: 'timeout',
  Cancelled: 'cancelled',
  Unknown: 'unknown',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type FailureCode = (typeof FailureCode)[keyof typeof FailureCode];

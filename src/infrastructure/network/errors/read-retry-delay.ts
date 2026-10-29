import { type Failure, TimeoutFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import {
  READ_RETRIES,
  READ_RETRY_BASE_MS,
  READ_RETRY_CAP_MS,
  READ_TIMEOUT_RETRIES,
} from '@infrastructure/constants/api/api-timeouts';
import { isRetryableReadFailure } from '@infrastructure/network/errors/is-retryable-read-failure';

/**
 * How long to wait before asking a failed read again — or `null` to give up and report it.
 *
 * @remarks
 * - **What is retried** — only reads, and only failures where the API was not reached or the
 *   gateway said it was briefly away ({@link isRetryableReadFailure}): Google AIP-194's rule that a
 *   client retries automatically only what is safe to repeat. Writes are never retried here.
 * - **How many** — a fast failure gets {@link READ_RETRIES}; a timeout, which already cost the
 *   user the whole timeout, gets {@link READ_TIMEOUT_RETRIES}.
 * - **How long** — capped exponential backoff with "equal jitter" (AWS Architecture Blog): half
 *   the ceiling plus a random half. The jitter spreads the phones that all lost the API in the
 *   same deploy restart; the fixed half keeps a retry from landing before the API is back.
 *
 * @param attempt - retries already made for this read (0 before the first retry)
 * @param random - `Math.random` in the app; a fixed value in tests
 */
export const readRetryDelayMs = (failure: Failure, attempt: number, random: () => number = Math.random): number | null => {
  if (!isRetryableReadFailure(failure)) return null;
  const limit = failure instanceof TimeoutFailure ? READ_TIMEOUT_RETRIES : READ_RETRIES;
  if (attempt >= limit) return null;
  const half = Math.min(READ_RETRY_CAP_MS, READ_RETRY_BASE_MS * ValueConstants.two ** attempt) / ValueConstants.two;
  return half + random() * half;
};

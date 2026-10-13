import { type Failure, ServerFailure } from '@core/failure';
import { isUnreachableFailure } from '@infrastructure/network/errors/is-unreachable-failure';
import { HttpStatus } from '@infrastructure/network/http/http-status';

/** The gateway answers a deploy restart or a stalled upstream gives: the API was not reached, so asking again is safe. */
const PASSING_SERVER_STATUSES: readonly number[] = [HttpStatus.badGateway, HttpStatus.serviceUnavailable, HttpStatus.gatewayTimeout];

/**
 * Whether a failed GET is worth one more try: it timed out, the connection
 * dropped, or the gateway said the API was briefly unavailable. Anything the
 * API itself decided (4xx, a 500) would only fail the same way again.
 */
export const isRetryableReadFailure = (failure: Failure): boolean =>
  isUnreachableFailure(failure) ||
  (failure instanceof ServerFailure && failure.status !== undefined && PASSING_SERVER_STATUSES.includes(failure.status));

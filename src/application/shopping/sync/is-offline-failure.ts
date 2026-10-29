import { type Failure, FailureCode } from '@core/failure';

/**
 * The API was never reached — the request timed out or the connection dropped — so the change
 * may not have happened and is worth sending again later. Anything the API answered (a 4xx, a
 * 5xx) is its decision, not a reason to queue.
 */
export const isOfflineFailure = (failure: Failure): boolean =>
  failure.code === FailureCode.Network || failure.code === FailureCode.Timeout;

import { type Failure, NetworkFailure, TimeoutFailure } from '@core/failure';

/** The request never got an answer from the API — it timed out or the connection dropped. */
export const isUnreachableFailure = (failure: Failure): boolean => failure instanceof TimeoutFailure || failure instanceof NetworkFailure;

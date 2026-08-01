import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';

/**
 * Failure produced when a request was sent but the server did not respond
 * within the allotted time budget (axios `ECONNABORTED` / `ETIMEDOUT`, or an
 * XHR upload `ontimeout`). Distinct from `NetworkFailure`: the connection was
 * reachable, it just took too long.
 *
 * Transport-level: the server never delivered an error envelope, so the
 * inherited `messageKey` is always `undefined` — it takes no key argument by
 * design.
 */
export class TimeoutFailure extends Failure {
  readonly code = FailureCode.Timeout;
  constructor(readonly message: string = 'Request timed out') {
    super();
  }
}

import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';

/**
 * Catch-all failure for unexpected errors that do not map to a more specific
 * failure subtype. The original `cause` is preserved for debugging but should
 * never be shown directly to the user.
 */
export class UnknownFailure extends Failure {
  readonly code = FailureCode.Unknown;
  constructor(
    readonly message: string = 'Unknown error',
    readonly cause?: unknown,
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

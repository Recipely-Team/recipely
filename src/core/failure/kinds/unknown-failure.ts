import { Failure } from '@core/failure/failure';

/**
 * Catch-all failure for unexpected errors that do not map to a more specific
 * failure subtype. The original `cause` is preserved for debugging but should
 * never be shown directly to the user.
 */
export class UnknownFailure extends Failure {
  readonly code = 'unknown';
  constructor(
    readonly message: string = 'Unknown error',
    readonly cause?: unknown,
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

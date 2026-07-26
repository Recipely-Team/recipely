import { Failure } from '@core/failure/failure';

/**
 * Failure produced when the server itself errored (HTTP 5xx). The fault is on
 * the backend, not the caller's input, so the UI should invite a retry rather
 * than ask the user to change anything. `status` preserves the exact code for
 * diagnostics.
 */
export class ServerFailure extends Failure {
  readonly code = 'server';
  constructor(
    readonly message: string = 'Server error',
    readonly status?: number,
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

import { Failure } from '@core/failure/failure';

/**
 * Failure produced when a requested resource does not exist on the server
 * (HTTP 404 equivalent).
 */
export class NotFoundFailure extends Failure {
  readonly code = 'not_found';
  constructor(
    readonly message: string = 'Not found',
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

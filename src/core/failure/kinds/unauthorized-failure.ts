import { Failure } from '@core/failure/failure';

/**
 * Failure produced when the caller lacks valid credentials or the server
 * returns a 401 / 403 response. The inherited `messageKey` (e.g.
 * `errors.unauthorized.invalid_token`) says why, when the server provides it.
 */
export class UnauthorizedFailure extends Failure {
  readonly code = 'unauthorized';
  constructor(
    readonly message: string = 'Unauthorized',
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

import { Failure } from '@core/failure/failure';

/**
 * Failure produced when the caller is authenticated but not allowed to perform
 * the action (HTTP 403). Distinct from `UnauthorizedFailure` (401), which means
 * the credentials are missing or invalid and re-authentication may help.
 */
export class ForbiddenFailure extends Failure {
  readonly code = 'forbidden';
  constructor(
    readonly message: string = 'Forbidden',
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

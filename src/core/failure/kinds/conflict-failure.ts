import { Failure } from '@core/failure/failure';

/**
 * Failure produced when the request conflicts with the current server state
 * (HTTP 409) — e.g. an email already registered, or a draft edited elsewhere.
 * The optional `field` names the offending input so the UI can highlight it;
 * the inherited `messageKey` (e.g. `errors.conflict.email_exists`) says which
 * conflict it is.
 */
export class ConflictFailure extends Failure {
  readonly code = 'conflict';
  constructor(
    readonly message: string = 'Conflict',
    readonly field?: string,
    messageKey?: string,
  ) {
    super(messageKey);
  }
}

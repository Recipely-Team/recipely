import { Failure } from '@core/failure/failure';

/**
 * Failure produced when a network request cannot be completed due to
 * connectivity issues, timeouts, or DNS errors.
 *
 * Transport-level: there is no server response, hence no error envelope, hence
 * the inherited `messageKey` is always `undefined` — it takes no key argument
 * by design.
 */
export class NetworkFailure extends Failure {
  readonly code = 'network';
  constructor(readonly message: string = 'Network error') {
    super();
  }
}

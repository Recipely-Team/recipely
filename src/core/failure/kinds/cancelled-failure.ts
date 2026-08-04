import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';

/**
 * The user ended the flow themselves — a Google/Apple sign-in sheet dismissed,
 * an OAuth popup closed.
 *
 * @remarks
 * - **It is not an error.** Nothing broke, nothing was refused, and there is
 *   nothing to retry differently. A screen that renders error copy for it tells
 *   a user who simply tapped outside a sheet that something went wrong.
 *   Consumers check `code === FailureCode.Cancelled` and stay silent.
 * - **Why it is a `Failure` at all.** The operation produced no session, and
 *   `Result<T, Failure>` is the one channel a use case answers on (rule 12).
 *   Widening every social sign-in to `Result<Session | null, …>` would have put
 *   the same question at every layer instead of once, here.
 * - **Never carries a `messageKey`.** No server was asked, so there is no
 *   error-catalogue entry to quote.
 */
export class CancelledFailure extends Failure {
  readonly code = FailureCode.Cancelled;
  constructor(readonly message: string = 'Cancelled by the user') {
    super();
  }
}

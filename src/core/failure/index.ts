/**
 * The failure vocabulary. The folder root holds the CONTRACT — the base class
 * and the two shapes it carries — while `kinds/` holds the catalogue of
 * concrete failures. Everything is consumed through this barrel, so a new kind
 * is one file plus one line here.
 */
export { Failure } from '@core/failure/failure';
export { ErrorMessageKey } from '@core/failure/error-message-key';
export type { ValidationFieldError } from '@core/failure/validation-field-error';

export { NetworkFailure } from '@core/failure/kinds/network-failure';
export { TimeoutFailure } from '@core/failure/kinds/timeout-failure';
export { UnauthorizedFailure } from '@core/failure/kinds/unauthorized-failure';
export { ForbiddenFailure } from '@core/failure/kinds/forbidden-failure';
export { NotFoundFailure } from '@core/failure/kinds/not-found-failure';
export { ValidationFailure } from '@core/failure/kinds/validation-failure';
export { ConflictFailure } from '@core/failure/kinds/conflict-failure';
export { RateLimitFailure } from '@core/failure/kinds/rate-limit-failure';
export { ServerFailure } from '@core/failure/kinds/server-failure';
export { CancelledFailure } from '@core/failure/kinds/cancelled-failure';
export { UnknownFailure } from '@core/failure/kinds/unknown-failure';
export { FailureCode } from './failure-code';

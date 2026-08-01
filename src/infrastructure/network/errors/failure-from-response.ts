import {
  type Failure,
  ConflictFailure,
  ForbiddenFailure,
  NotFoundFailure,
  RateLimitFailure,
  ServerFailure,
  UnauthorizedFailure,
  UnknownFailure,
  ValidationFailure,
} from '@core/failure';
import type { RecipelyErrorPayload } from '@infrastructure/network/errors/recipely-error-payload';
import { isObject } from '@core/guards/type-guards';
import { HttpStatus } from '@infrastructure/network/http/http-status';
import { ApiErrorCode } from '@infrastructure/constants/api-error-code';

/**
 * The Recipely backend wraps every error as
 * `{ error: { code, message, messageKey, field? } }` inside the AES envelope.
 * The HTTP client decrypts the envelope, then hands the decrypted body here.
 *
 * `messageKey` is a stable key from the backend error catalogue (e.g.
 * `errors.ai.prompt_rejected`). Every field is optional on the wire: an older
 * backend predates the catalogue and sends no `messageKey` at all, so this type
 * — and everything downstream of it — must tolerate `undefined`.
 */
interface RecipelyErrorBody {
  error?: RecipelyErrorPayload;
}

const isRecipelyErrorBody = (body: unknown): body is RecipelyErrorBody =>
  isObject(body) && 'error' in body;

/**
 * Maps a non-2xx HTTP response to the domain `Failure` hierarchy. The backend's
 * machine-readable `error.code` takes precedence so controller/store code never
 * branches on HTTP quirks; the numeric status is the fallback for responses that
 * lack a structured envelope. Every branch returns a concrete subtype — there is
 * no path that drops the error on the floor.
 *
 * `error.messageKey` rides along on EVERY branch, untouched and uninterpreted:
 * `code` is lossy (both `errors.ai.prompt_rejected` and
 * `errors.ai.invalid_response` arrive as `unprocessable` → `ValidationFailure`),
 * so the key is what lets presentation pick precise copy. Deciding what a key
 * *means* is presentation/i18n's job — infrastructure only transports it and
 * never switches on a key literal.
 */
export const failureFromResponse = (status: number, body: unknown): Failure => {
  const envelope = isRecipelyErrorBody(body) ? body.error : undefined;
  const message = envelope?.message ?? `HTTP ${status}`;
  const messageKey = envelope?.messageKey;

  if (envelope?.code) {
    switch (envelope.code) {
      case ApiErrorCode.Validation:
        return new ValidationFailure(message, envelope.field, messageKey);
      case ApiErrorCode.Unprocessable:
        // 422: the request arrived but a required piece (e.g. a missing image or
        // field) was absent. Surface as ValidationFailure so the UI reads it as
        // "fix your input"; `field` tells the UI which input was missing, and
        // `messageKey` which of the several 422s this actually is.
        return new ValidationFailure(message, envelope.field, messageKey);
      case ApiErrorCode.Unauthorized:
        return new UnauthorizedFailure(message, messageKey);
      case ApiErrorCode.Forbidden:
        return new ForbiddenFailure(message, messageKey);
      case ApiErrorCode.NotFound:
        return new NotFoundFailure(message, messageKey);
      case ApiErrorCode.Conflict:
        return new ConflictFailure(message, envelope.field, messageKey);
      case ApiErrorCode.RateLimit:
      case ApiErrorCode.TooManyRequests:
        return new RateLimitFailure(message, undefined, messageKey);
      case ApiErrorCode.Server:
      case ApiErrorCode.Internal:
        return new ServerFailure(message, status, messageKey);
    }
  }

  if (status === HttpStatus.unauthorized) return new UnauthorizedFailure(message, messageKey);
  if (status === HttpStatus.forbidden) return new ForbiddenFailure(message, messageKey);
  if (status === HttpStatus.notFound) return new NotFoundFailure(message, messageKey);
  if (status === HttpStatus.conflict) return new ConflictFailure(message, envelope?.field, messageKey);
  if (status === HttpStatus.tooManyRequests) return new RateLimitFailure(message, undefined, messageKey);
  if (status >= HttpStatus.serverErrorMin) return new ServerFailure(message, status, messageKey);
  if (status >= HttpStatus.clientErrorMin) return new ValidationFailure(message, envelope?.field, messageKey);
  return new UnknownFailure(message, undefined, messageKey);
};

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
  typeof body === 'object' && body !== null && 'error' in body;

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
      case 'validation':
        return new ValidationFailure(message, envelope.field, messageKey);
      case 'unprocessable':
        // 422: the request arrived but a required piece (e.g. a missing image or
        // field) was absent. Surface as ValidationFailure so the UI reads it as
        // "fix your input"; `field` tells the UI which input was missing, and
        // `messageKey` which of the several 422s this actually is.
        return new ValidationFailure(message, envelope.field, messageKey);
      case 'unauthorized':
        return new UnauthorizedFailure(message, messageKey);
      case 'forbidden':
        return new ForbiddenFailure(message, messageKey);
      case 'not_found':
        return new NotFoundFailure(message, messageKey);
      case 'conflict':
        return new ConflictFailure(message, envelope.field, messageKey);
      case 'rate_limit':
      case 'too_many_requests':
        return new RateLimitFailure(message, undefined, messageKey);
      case 'server':
      case 'internal':
        return new ServerFailure(message, status, messageKey);
    }
  }

  if (status === 401) return new UnauthorizedFailure(message, messageKey);
  if (status === 403) return new ForbiddenFailure(message, messageKey);
  if (status === 404) return new NotFoundFailure(message, messageKey);
  if (status === 409) return new ConflictFailure(message, envelope?.field, messageKey);
  if (status === 429) return new RateLimitFailure(message, undefined, messageKey);
  if (status >= 500) return new ServerFailure(message, status, messageKey);
  if (status >= 400) return new ValidationFailure(message, envelope?.field, messageKey);
  return new UnknownFailure(message, undefined, messageKey);
};

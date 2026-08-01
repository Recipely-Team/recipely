import { AxiosError } from 'axios';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { AxiosErrorCode } from '@infrastructure/network/http/http-status';
import {
  type Failure,
  NetworkFailure,
  TimeoutFailure,
  UnknownFailure,
  ValidationFailure,
} from '@core/failure';
import { failureFromResponse } from '@infrastructure/network/errors/failure-from-response';
import { EnvelopeDecryptError } from '@infrastructure/crypto/envelope-decrypt-error';

/**
 * Maps a thrown request error to a domain `Failure`.
 *
 * WHY: the Recipely backend wraps errors as
 * `{ error: { code, message, messageKey, field? } }` inside the AES envelope.
 * The response interceptor decrypts it, then this maps `code` → domain Failure
 * (see `failureFromResponse`) so controller/store code never sees HTTP quirks.
 * A failed envelope decrypt surfaces as a `ValidationFailure`; timeouts and
 * connection errors get their own subtypes.
 *
 * Only the `error.response` branch can carry a server `messageKey` — it is the
 * only branch with a decoded envelope. Every other branch is transport- or
 * client-level (no response body, hence no key) and leaves `Failure.messageKey`
 * `undefined`; presentation falls back to `code` for those.
 *
 * The English sentences below are diagnostics, not user copy. Nothing renders
 * `Failure.message`: presentation resolves what the user reads from
 * `messageKey`, then `code` (`failure-lookups.ts`), so these strings only ever
 * reach a log or a crash report.
 */
export const mapAxiosError = (error: unknown): Failure => {
  if (error instanceof EnvelopeDecryptError) {
    return new ValidationFailure(DiagnosticMessage.network.badEnvelope(error.message));
  }
  if (!(error instanceof AxiosError)) {
    return new UnknownFailure(DiagnosticMessage.network.unexpected, error);
  }

  if (error.code === AxiosErrorCode.timedOut || error.code === AxiosErrorCode.connectionTimedOut) {
    return new TimeoutFailure(DiagnosticMessage.network.timedOut);
  }

  if (error.response) {
    return failureFromResponse(error.response.status, error.response.data);
  }
  if (error.request) {
    return new NetworkFailure(error.message || DiagnosticMessage.network.unreachable);
  }
  return new UnknownFailure(error.message, error);
};

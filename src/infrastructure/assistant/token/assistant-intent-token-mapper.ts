import type { AssistantIntentTokenResponseDto } from '@infrastructure/assistant/token/dtos/assistant-intent-token-response-dto';
import { CharConstants, ValueConstants } from '@core/constants';
import type { OsAssistantCredential } from '@domain/assistant/os/os-assistant-credential';

/**
 * Reads the intent-token response, refusing anything it cannot date.
 *
 * A token with no expiry is not a long-lived token, it is a token nobody can
 * ever decide to replace — the native side would either trust it forever or
 * throw it away on every launch. An unparseable instant is the same thing
 * wearing a date, so both answer `null` and the caller keeps the credential it
 * already has rather than publishing a worse one.
 */
export function toOsAssistantCredential(
  dto: AssistantIntentTokenResponseDto,
): OsAssistantCredential | null {
  const token = dto.token ?? CharConstants.empty;
  if (token.length === ValueConstants.zero) return null;

  const expiresAt = Date.parse(dto.expiresAt ?? CharConstants.empty);
  if (Number.isNaN(expiresAt)) return null;

  return { token, expiresAt };
}

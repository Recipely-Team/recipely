import { AssistantDenialReason, type AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import type { AssistantSessionGrantType } from '@domain/assistant/session/assistant-session-grant';
import type { AssistantSessionResponseDto } from '@infrastructure/assistant/token/dtos/assistant-session-response-dto';
import { isNonEmptyString } from '@core/guards/type-guards';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Narrows the server's answer into a grant or a denial.
 *
 * @remarks
 * - **A token is what makes it a grant**, not the absence of a reason. The wire
 *   shape has both fields optional, so a response could arrive claiming a
 *   denial while carrying credentials, or a grant with no way to connect;
 *   keying on the field the app actually needs means neither case reaches a
 *   screen.
 * - **An unrecognised reason denies rather than grants.** A future server may
 *   refuse for something this build has never heard of, and the safe reading of
 *   "no token, unknown reason" is that voice is unavailable — the app falls
 *   back to text, which is what it would have done anyway.
 * - **`unlimited` is read as a flag, never inferred from the number.** An
 *   unmetered account is sent a large floor so that builds predating the flag
 *   keep working; taking a big number to mean "no limit" would have made the
 *   two indistinguishable, and made every generous allowance unlimited.
 */
export function toAssistantSessionGrant(dto: AssistantSessionResponseDto): AssistantSessionGrantType {
  const remainingSeconds = dto.budgetRemainingSec ?? ValueConstants.zero;

  if (
    isNonEmptyString(dto.token) &&
    isNonEmptyString(dto.model) &&
    isNonEmptyString(dto.wsUrl)
  ) {
    return {
      status: AssistantGrantStatus.Granted,
      credentials: {
        token: dto.token,
        model: dto.model,
        wsUrl: dto.wsUrl,
        expiresAt: dto.expiresAt ?? CharConstants.empty,
      },
      remainingSeconds,
      isUnlimited: dto.unlimited === true,
    };
  }

  return { status: AssistantGrantStatus.Denied, reason: denialReason(dto.reason), remainingSeconds };
}

function denialReason(raw: string | undefined): AssistantDenialReasonType {
  return raw === AssistantDenialReason.GlobalDailyLimit
    ? AssistantDenialReason.GlobalDailyLimit
    : AssistantDenialReason.UserDailyLimit;
}

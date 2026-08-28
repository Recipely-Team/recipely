import { AssistantDenialReason, type AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

/**
 * How loudly the assistant's notice line should be shown.
 *
 * @remarks
 * Everything used to render as one muted caption at the top of the sheet, so a
 * request that failed looked exactly like a note about the weather — "hata
 * tepede siyah olunca belli olmuyor". These are not the same news:
 *
 * - **A failure is `danger`.** Something the user asked for did not happen and
 *   they have to know, because the next thing they say assumes it did.
 * - **Running out of minutes is `warning`.** Nothing broke; a limit was
 *   reached, and the advice ("tomorrow", "try typing") is actionable.
 * - **Everything else stays `neutral`.** Voice being off on a screen that never
 *   offered it is not an event, and shouting it would train the user to ignore
 *   the surface that also carries the failures.
 */
export function assistantNoticeTone(
  hasError: boolean,
  reason: AssistantDenialReasonType | null,
): SeverityType {
  if (hasError) return SeverityType.Danger;
  if (
    reason === AssistantDenialReason.UserDailyLimit ||
    reason === AssistantDenialReason.GlobalDailyLimit ||
    reason === AssistantDenialReason.MicrophoneDenied
  ) {
    return SeverityType.Warning;
  }
  return SeverityType.Neutral;
}

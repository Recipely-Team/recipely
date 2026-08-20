import { AssistantDenialReason, type AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { t } from '@presentation/i18n';

/**
 * The line the panel shows when voice is not available.
 *
 * @remarks
 * A refusal and an outage both land on `Unavailable`, and they are not the same
 * news. Reading the status alone, an unreachable backend told the user they had
 * used up minutes they had never spent — advice ("come back tomorrow") that was
 * wrong twice over, since the outage might clear in a second. Only a stated
 * reason may claim a limit; everything else says voice is off without saying
 * why, which is the truth available.
 */
export function assistantNotice(
  status: AssistantStatusType,
  reason: AssistantDenialReasonType | null,
): string | null {
  if (status !== AssistantStatus.Unavailable) return null;
  if (reason === AssistantDenialReason.GlobalDailyLimit) return t().assistant.busyEverywhere;
  if (reason === AssistantDenialReason.UserDailyLimit) return t().assistant.outOfMinutes;
  return t().assistant.unavailable;
}

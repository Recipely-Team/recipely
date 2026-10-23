import type { AssistantStatus } from '@application/assistant/session/assistant-status';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';

/**
 * Voice cannot run now. The only state with a reason: a refused microphone, a
 * spent daily budget or a closed global one. `null` when no reason was given
 * (the budget ran out mid-session, or the mint failed for another cause).
 */
export interface AssistantUnavailable {
  status: typeof AssistantStatus.Unavailable;
  deniedReason: AssistantDenialReasonType | null;
}

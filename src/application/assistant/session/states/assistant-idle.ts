import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** Nothing running; the orb is at rest. */
export interface AssistantIdle {
  status: typeof AssistantStatus.Idle;
}

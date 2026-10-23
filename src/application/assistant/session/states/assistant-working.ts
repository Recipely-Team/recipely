import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** A typed turn is on its way over HTTP. */
export interface AssistantWorking {
  status: typeof AssistantStatus.Working;
}

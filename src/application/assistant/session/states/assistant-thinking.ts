import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** Live: the model is working out its answer. */
export interface AssistantThinking {
  status: typeof AssistantStatus.Thinking;
}

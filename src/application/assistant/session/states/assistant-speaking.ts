import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** Live: the model's voice is playing. */
export interface AssistantSpeaking {
  status: typeof AssistantStatus.Speaking;
}

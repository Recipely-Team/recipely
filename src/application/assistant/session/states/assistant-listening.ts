import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** Live: the microphone is open and the model is listening. */
export interface AssistantListening {
  status: typeof AssistantStatus.Listening;
}

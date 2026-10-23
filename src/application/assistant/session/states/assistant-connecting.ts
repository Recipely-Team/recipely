import type { AssistantStatus } from '@application/assistant/session/assistant-status';

/** A session is being minted and its socket opened. */
export interface AssistantConnecting {
  status: typeof AssistantStatus.Connecting;
}

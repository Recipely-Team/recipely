import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantStatusType } from '@application/assistant/session/assistant-status';
import type { Failure } from '@core/failure';

export interface AssistantSessionStoreState {
  status: AssistantStatusType;
  /** Open panel vs. collapsed pill. The assistant drives the app in view, so
   *  the panel never covers the screen it is working on. */
  isPanelOpen: boolean;
  transcript: AssistantTranscriptLine[];
  /** Seconds of voice left today, as the server last reported them. */
  remainingSeconds: number;
  deniedReason: AssistantDenialReasonType | null;
  error: Failure | null;

  openPanel: () => void;
  closePanel: () => void;
  startVoice: (languageCode: string) => Promise<void>;
  stopVoice: () => Promise<void>;
  sendText: (text: string) => void;
  clearError: () => void;
  reset: () => void;
}

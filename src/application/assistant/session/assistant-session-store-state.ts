import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantStatusType } from '@application/assistant/session/assistant-status';
import type { AssistantViewType } from '@application/assistant/session/assistant-view';
import type { Failure } from '@core/failure';

export interface AssistantSessionStoreState {
  status: AssistantStatusType;
  /** How much of the assistant is showing. The assistant drives the app in
   *  view, so the panel never covers the screen it is working on. */
  view: AssistantViewType;
  /**
   * How loud the side that is currently making sound is, from 0 to 1.
   *
   * Already scaled for a waveform to render directly — see
   * `AssistantLevelMeter`, which also decides how often this changes. It is 0
   * whenever nothing is being captured, and muting the microphone drops it to
   * 0 — but playback keeps publishing, because mute silences the user, not the
   * assistant, and a flat line while it is mid-sentence would say otherwise.
   */
  level: number;
  /**
   * Whether captured audio is being withheld from the socket.
   *
   * A real mute, not a label: while it is set no frame is sent, so the model
   * hears silence rather than a conversation it was not meant to be part of.
   */
  isMuted: boolean;
  transcript: AssistantTranscriptLine[];
  /** Seconds of voice left today, as the server last reported them. */
  remainingSeconds: number;
  /**
   * Tokens this session has spent, as the API last reported them.
   *
   * The whole design is shaped by token cost, so the number that decides it is
   * carried rather than discarded — it is what makes the budget checkable
   * against a real conversation instead of an estimate.
   */
  tokensUsed: number;
  deniedReason: AssistantDenialReasonType | null;
  error: Failure | null;

  setView: (view: AssistantViewType) => void;
  toggleMute: () => void;
  startVoice: (languageCode: string) => Promise<void>;
  stopVoice: () => Promise<void>;
  /**
   * Sends a typed turn. `locale` is required because this path also runs with
   * no session behind it — out of budget there is no socket and no minted
   * language, and this is exactly the case the text mode exists for.
   */
  sendText: (text: string, locale: string) => void;
  clearError: () => void;
  reset: () => void;
}

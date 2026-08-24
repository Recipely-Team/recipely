import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';

/**
 * Whether the waveform is drawing a voice right now.
 *
 * @remarks
 * Muting silences the microphone, not the assistant. While the model is
 * mid-sentence the bars are drawing ITS voice, and flattening them there
 * claimed the session had gone quiet when it had not. Both places that draw a
 * waveform ask this, because it is a rule about what the bars MEAN rather than
 * a layout detail either of them owns.
 */
export function assistantIsSounding(status: AssistantStatusType, isMuted: boolean): boolean {
  if (status === AssistantStatus.Idle) return false;
  return !isMuted || status === AssistantStatus.Speaking;
}

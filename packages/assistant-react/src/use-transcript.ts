import type { AssistantState, TranscriptEntry } from '@live-assistant/core';
import { useAssistantState } from './use-assistant-state';

const selectTranscript = (state: AssistantState): readonly TranscriptEntry[] => state.transcript;

/**
 * The conversation so far, for rendering it your own way.
 *
 * The array changes only when an entry does; entries keep their `id` while a
 * message grows, so a list keyed by `id` re-renders the one line that moved.
 */
export function useTranscript(): readonly TranscriptEntry[] {
  return useAssistantState(selectTranscript);
}

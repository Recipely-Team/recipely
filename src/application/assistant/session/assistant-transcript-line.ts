import type { ChatRole } from '@domain/drafts/chat-role';

/** One line of the conversation, as the transcript panel shows it. */
export interface AssistantTranscriptLine {
  readonly id: string;
  readonly speaker: ChatRole;
  readonly text: string;
}

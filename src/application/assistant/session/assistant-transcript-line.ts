import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import type { ChatRole } from '@domain/drafts/chat-role';

/**
 * One line of the conversation, as the transcript panel shows it.
 *
 * @remarks
 * - **An action is part of the conversation.** The assistant drives the app, so
 *   "I opened the lentil soup" is something the user needs to see even though
 *   nobody said it; interleaving it with speech is what makes the transcript a
 *   record of what happened rather than of what was pronounced.
 * - **No user-visible text on an action line.** It carries the action KEY, and
 *   the label is looked up in the presentation layer — a line built here with a
 *   sentence on it would be English in a Turkish panel, and untranslatable.
 * - **`detail` is a phrase, never a payload.** It is what the chip shows beside
 *   its label — the query that was searched, the title that was written — and
 *   is absent whenever the argument was longer or more structured than that.
 */
export type AssistantTranscriptLine =
  | {
      readonly kind: typeof AssistantTranscriptLineKind.Speech;
      readonly id: string;
      readonly speaker: ChatRole;
      readonly text: string;
    }
  | {
      readonly kind: typeof AssistantTranscriptLineKind.Action;
      readonly id: string;
      readonly action: AssistantActionType;
      readonly detail?: string;
    };

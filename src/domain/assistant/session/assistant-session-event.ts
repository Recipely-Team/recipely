import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import type { ChatRole } from '@domain/drafts/chat-role';

/**
 * Everything a live session can tell the app, as one union.
 *
 * @remarks
 * - **`transcript` carries text the model never sent as text.** Native-audio
 *   models support only the `AUDIO` response modality, so what the screen
 *   prints comes from the input/output transcription streams rather than from
 *   a text part. `final` marks the end of an utterance; partials arrive first
 *   and replace each other.
 * - **`interrupted` is an event, not a flag.** It is the moment the playback
 *   queue must be dropped, and treating it as state to be polled is how a
 *   sentence the user cut off finishes anyway.
 * - **`goAway` is a warning with a deadline**, not a close. The connection is
 *   about to be dropped by the server; `timeLeftMs` is the window in which the
 *   resumption handle can be used to continue without paying setup again.
 * - **`usage` is here so the token budget is measurable in production.** The
 *   plan's entire cost model rests on the numbers this event reports.
 * - **`toolCall.action` stays a bare string on purpose.** It is a word a model
 *   chose, so narrowing it to `AssistantActionType` in the mapper would mean
 *   deciding what to do about an unrecognised one there — and the only correct
 *   answer, telling the model its call failed, needs the `callId` this event
 *   carries. The registry does the narrowing, because the registry is what can
 *   answer.
 */
export type AssistantSessionEventType =
  | { readonly kind: typeof AssistantEventKind.Ready }
  | {
      readonly kind: typeof AssistantEventKind.Transcript;
      readonly speaker: ChatRole;
      readonly text: string;
      readonly final: boolean;
    }
  | { readonly kind: typeof AssistantEventKind.Audio; readonly samples: Float32Array<ArrayBuffer> }
  | {
      readonly kind: typeof AssistantEventKind.ToolCall;
      readonly callId: string;
      readonly action: string;
      readonly arg?: string;
    }
  | { readonly kind: typeof AssistantEventKind.Interrupted }
  | { readonly kind: typeof AssistantEventKind.TurnComplete }
  | { readonly kind: typeof AssistantEventKind.Resumption; readonly handle: string }
  | { readonly kind: typeof AssistantEventKind.GoAway; readonly timeLeftMs: number }
  | { readonly kind: typeof AssistantEventKind.Usage; readonly totalTokens: number }
  | { readonly kind: typeof AssistantEventKind.Closed; readonly expected: boolean };

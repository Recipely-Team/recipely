import type { ToolCall } from '../tools/tool-call';
import type { SessionEventKind } from './session-event-kind';
import type { SpeakerType } from './speaker';

/**
 * Everything a live session can report, as one union.
 *
 * @remarks
 * - **One provider frame is often several events.** A single frame can carry a
 *   transcript fragment, audio and the end of the turn at once; adapters emit
 *   them in the order they must be handled (`interrupted` before any audio
 *   beside it).
 * - **`interrupted` is an event, not a flag.** It is the moment the playback
 *   queue must be dropped.
 * - **`goAway` is a warning with a deadline**, not a close: `timeLeftMs` is the
 *   window in which the resumption handle can continue the session.
 */
export type SessionEvent =
  | { readonly kind: typeof SessionEventKind.Ready }
  | { readonly kind: typeof SessionEventKind.Transcript; readonly speaker: SpeakerType; readonly text: string }
  | { readonly kind: typeof SessionEventKind.Audio; readonly samples: Float32Array<ArrayBuffer> }
  | { readonly kind: typeof SessionEventKind.ToolCall; readonly call: ToolCall }
  | { readonly kind: typeof SessionEventKind.ToolCallCancelled; readonly callIds: readonly string[] }
  | { readonly kind: typeof SessionEventKind.Interrupted }
  | { readonly kind: typeof SessionEventKind.TurnComplete }
  | { readonly kind: typeof SessionEventKind.Resumption; readonly handle: string }
  | { readonly kind: typeof SessionEventKind.GoAway; readonly timeLeftMs: number }
  | { readonly kind: typeof SessionEventKind.Usage; readonly totalTokens: number }
  | { readonly kind: typeof SessionEventKind.Closed; readonly expected: boolean };

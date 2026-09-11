import type { SpeakerType } from '../session/speaker';
import type { ToolCall } from '../tools/tool-call';
import type { ToolRunStatusType } from './tool-run-status';
import type { TranscriptEntryKind } from './transcript-entry-kind';

/**
 * One line of the conversation, as a UI renders it.
 *
 * @remarks
 * - **A message grows while `isFinal` is false.** Speech is transcribed a
 *   fragment at a time; the entry's `text` is replaced (never re-created) as
 *   fragments arrive, keyed by a stable `id`, so a list can animate it.
 * - **Tool entries are the "what it did" between the lines.** A UI may show
 *   them as chips, hide them, or show only failures — they carry the call and,
 *   once settled, the response the model was given.
 */
export type TranscriptEntry =
  | {
      readonly kind: typeof TranscriptEntryKind.Message;
      readonly id: string;
      readonly speaker: SpeakerType;
      readonly text: string;
      readonly isFinal: boolean;
    }
  | {
      readonly kind: typeof TranscriptEntryKind.Tool;
      readonly id: string;
      readonly call: ToolCall;
      readonly status: ToolRunStatusType;
      readonly response?: Readonly<Record<string, unknown>>;
    };

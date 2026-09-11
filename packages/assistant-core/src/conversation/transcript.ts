import type { SpeakerType } from '../session/speaker';
import type { ToolCall } from '../tools/tool-call';
import { ToolRunStatus } from './tool-run-status';
import type { ToolRunStatusType } from './tool-run-status';
import type { TranscriptEntry } from './transcript-entry';
import { TranscriptEntryKind } from './transcript-entry-kind';

/**
 * Builds the conversation's transcript out of the fragments a session sends.
 *
 * @remarks
 * - **Fragments join into one message.** A sentence arrives a word or two at a
 *   time; appending each as its own entry turns one answer into a column of
 *   one-word bubbles. Fragments carry their own spacing, so they are
 *   concatenated as they are.
 * - **A message stays open only while it is the last thing said.** A tool
 *   entry landing mid-sentence, the other party speaking, or `closeTurn` (the
 *   caller's utterance gap, an interruption, the end of a turn) closes it.
 * - **Immutable snapshots.** Every change produces a new `entries` array and
 *   new objects for what changed, so a React list re-renders only what moved.
 */
export class Transcript {
  private list: TranscriptEntry[] = [];
  private openId: string | null = null;
  private nextId = 0;

  get entries(): readonly TranscriptEntry[] {
    return this.list;
  }

  /** Adds spoken text to the open message of the same speaker, or opens a new one. */
  appendSpeech(speaker: SpeakerType, text: string): void {
    const last = this.list[this.list.length - 1];
    if (
      last !== undefined &&
      last.id === this.openId &&
      last.kind === TranscriptEntryKind.Message &&
      last.speaker === speaker
    ) {
      this.replaceLast({ ...last, text: last.text + text });
      return;
    }

    this.closeTurn();
    const id = this.newId();
    this.list = [...this.list, { kind: TranscriptEntryKind.Message, id, speaker, text, isFinal: false }];
    this.openId = id;
  }

  /** Adds a complete message — a typed turn — that nothing will grow. */
  addMessage(speaker: SpeakerType, text: string): void {
    this.closeTurn();
    this.list = [...this.list, { kind: TranscriptEntryKind.Message, id: this.newId(), speaker, text, isFinal: true }];
  }

  /** Marks the open message final; the next speech starts a new one. */
  closeTurn(): void {
    const openId = this.openId;
    this.openId = null;
    if (openId === null) return;

    this.list = this.list.map((entry) =>
      entry.id === openId && entry.kind === TranscriptEntryKind.Message ? { ...entry, isFinal: true } : entry,
    );
  }

  addTool(call: ToolCall): void {
    this.closeTurn();
    this.list = [...this.list, { kind: TranscriptEntryKind.Tool, id: this.newId(), call, status: ToolRunStatus.Running }];
  }

  /** Settles a running tool entry. A call already settled (a cancelled one, say) is left as it is. */
  settleTool(callId: string, status: ToolRunStatusType, response?: Readonly<Record<string, unknown>>): void {
    this.list = this.list.map((entry) =>
      entry.kind === TranscriptEntryKind.Tool && entry.call.id === callId && entry.status === ToolRunStatus.Running
        ? { ...entry, status, ...(response !== undefined ? { response } : {}) }
        : entry,
    );
  }

  clear(): void {
    this.list = [];
    this.openId = null;
  }

  private replaceLast(entry: TranscriptEntry): void {
    this.list = [...this.list.slice(0, -1), entry];
  }

  private newId(): string {
    this.nextId += 1;
    return String(this.nextId);
  }
}

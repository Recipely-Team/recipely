import type { TranscriptEntry } from '@live-assistant/core';
import type { AssistantTranscriptLineType } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { toTranscriptLines } from '@application/assistant/session/assistant-transcript-lines';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { ChatRole } from '@domain/drafts/chat-role';
import { ValueConstants } from '@core/constants';

/** A line the app adds itself; its id is given when it is placed. */
type NewLine =
  | { readonly kind: typeof AssistantTranscriptLineKind.Speech; readonly speaker: ChatRole; readonly text: string }
  | { readonly kind: typeof AssistantTranscriptLineKind.Action; readonly action: AssistantActionType; readonly detail?: string };

const EXTRA_ID_PREFIX = 'app-';

/**
 * The transcript lines the app adds beside the live session's own.
 *
 * @remarks
 * - **Anchored, not appended.** Each line remembers how many session entries
 *   existed when it was added, so a typed turn answered over HTTP stays where
 *   the user saw it, however the session's transcript grows afterwards.
 * - **Own id space.** `app-<n>` never collides with the library's entry ids.
 */
export class AssistantTranscriptExtras {
  private extras: { after: number; line: AssistantTranscriptLineType }[] = [];
  private lastId = ValueConstants.zero;

  /** Places a line after the first `after` session entries. */
  add(line: NewLine, after: number): void {
    this.lastId += ValueConstants.one;
    this.extras = [...this.extras, { after, line: { ...line, id: `${EXTRA_ID_PREFIX}${this.lastId}` } }];
  }

  /** The panel's transcript: the session's entries with these lines merged in. */
  merge(entries: readonly TranscriptEntry[]): AssistantTranscriptLineType[] {
    return toTranscriptLines(entries, this.extras);
  }

  clear(): void {
    this.extras = [];
  }
}

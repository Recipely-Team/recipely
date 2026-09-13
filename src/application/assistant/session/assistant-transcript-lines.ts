import { ToolRunStatus, TranscriptEntryKind } from '@live-assistant/core';
import type { TranscriptEntry } from '@live-assistant/core';
import { ApiLiveTool } from '@infrastructure/constants/api/api-live-tool';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
import { CharConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';

/** Longer than a phrase is not a chip: it wraps, and the transcript stops being scannable. */
const MAX_DETAIL_CHARS = 40;
/** An argument carrying structure is a payload the model wrote for a handler, not a phrase for a person. */
const STRUCTURED_DETAIL = /[{}[\]<>]/;

/** What the handler NAMED wins over what the model asked for: the title that now exists, not the request. */
export function actionDetail(arg: unknown, response: Readonly<Record<string, unknown>> | undefined): string | undefined {
  const title = response?.title;
  const candidate = isString(title) ? title : isString(arg) ? arg : undefined;
  if (candidate === undefined || candidate === CharConstants.empty) return undefined;
  if (candidate.length > MAX_DETAIL_CHARS || STRUCTURED_DETAIL.test(candidate)) return undefined;
  return candidate;
}

/** One controller entry as a panel line, or null for an entry the panel does not show. */
function toLine(entry: TranscriptEntry): AssistantTranscriptLine | null {
  if (entry.kind === TranscriptEntryKind.Message) {
    return { kind: AssistantTranscriptLineKind.Speech, id: entry.id, speaker: entry.speaker, text: entry.text };
  }
  // Only an action that RAN earns a chip: one refused or impossible did not happen.
  const action = entry.call.args[ApiLiveTool.actionField];
  if (
    entry.status !== ToolRunStatus.Succeeded ||
    entry.call.name !== ApiLiveTool.name ||
    !isString(action) ||
    !isAssistantAction(action)
  ) {
    return null;
  }
  const detail = actionDetail(entry.call.args[ApiLiveTool.argField], entry.response);
  return { kind: AssistantTranscriptLineKind.Action, id: entry.id, action, ...(detail !== undefined ? { detail } : {}) };
}

/**
 * The panel's transcript: the library session's entries, with the app's own
 * lines placed where they happened.
 *
 * @remarks
 * - **Two sources, one conversation.** The session owns what was said and done
 *   over the socket; the app adds what happened beside it — a typed turn
 *   answered over HTTP, the note that a quiet session ended. Each app line is
 *   anchored to how many session entries existed when it was added, so the
 *   merge keeps the order the user saw it happen in.
 * - **Ids come from the entries.** A message keeps its id while it grows, so
 *   the list re-renders the row that moved rather than all of them.
 */
export function toTranscriptLines(
  entries: readonly TranscriptEntry[],
  extras: readonly { readonly after: number; readonly line: AssistantTranscriptLine }[],
): AssistantTranscriptLine[] {
  const lines: AssistantTranscriptLine[] = [];
  let next = 0;
  const flushExtras = (upTo: number): void => {
    while (next < extras.length && (extras[next]?.after ?? 0) <= upTo) {
      const extra = extras[next];
      if (extra !== undefined) lines.push(extra.line);
      next += 1;
    }
  };

  flushExtras(0);
  entries.forEach((entry, index) => {
    const line = toLine(entry);
    if (line !== null) lines.push(line);
    flushExtras(index + 1);
  });
  flushExtras(Number.POSITIVE_INFINITY);
  return lines;
}

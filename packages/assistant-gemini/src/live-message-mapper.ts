import { SessionEventKind, Speaker, pcm16Base64ToFloat32 } from '@live-assistant/core';
import type { SessionEvent } from '@live-assistant/core';
import type { LiveServerMessageDto } from './dtos/live-server-message-dto';
import { isNonEmptyString } from './guards';

/**
 * Turns one Live API frame into the events a consumer acts on.
 *
 * @remarks
 * - **A frame is not an event; it is a bag of them.** A single `serverContent`
 *   routinely carries a transcript fragment, several audio chunks and the end
 *   of the turn at once, so this returns a list. Mapping one frame to one event
 *   would have meant picking which of them to lose.
 * - **Order within the frame is the order they must be handled.** `interrupted`
 *   is emitted before any audio in the same frame: the server can mark a turn
 *   interrupted and still include trailing chunks of it, and handling those
 *   first would enqueue exactly the audio the flush was meant to drop.
 * - **`turnComplete`, not `generationComplete`.** The latter fires when the
 *   model stops generating, which is before the audio it generated has been
 *   sent — treating it as the end of the turn cuts the last words off.
 * - **`timeLeft` is a protobuf duration string** (`"9.5s"`), not a number, and
 *   parsing it as one silently yields `NaN` for every value with a unit.
 * - **A tool call keeps its name and raw `args`.** The package does not know
 *   which tools a consumer declared, so it neither validates nor narrows them;
 *   a call is dropped only when it has no id or name, because nothing could
 *   answer it.
 * - **Unknown frames map to nothing rather than to a failure.** The API adds
 *   message types over time and a session that fell over on an unrecognised
 *   one would be broken by a server-side release.
 */
const AUDIO_MIME_PREFIX = 'audio/';
const SECONDS_SUFFIX = 's';
const MS_PER_SECOND = 1000;

function parseTimeLeftMs(timeLeft: string | undefined): number {
  if (!isNonEmptyString(timeLeft)) return 0;

  const seconds = Number.parseFloat(
    timeLeft.endsWith(SECONDS_SUFFIX) ? timeLeft.slice(0, -SECONDS_SUFFIX.length) : timeLeft,
  );
  return Number.isFinite(seconds) ? seconds * MS_PER_SECOND : 0;
}

export function mapLiveServerMessage(dto: LiveServerMessageDto): SessionEvent[] {
  const events: SessionEvent[] = [];

  if (dto.setupComplete !== undefined) events.push({ kind: SessionEventKind.Ready });

  const content = dto.serverContent;
  if (content !== undefined) {
    if (content.interrupted === true) events.push({ kind: SessionEventKind.Interrupted });

    const heard = content.inputTranscription?.text;
    if (isNonEmptyString(heard)) {
      events.push({ kind: SessionEventKind.Transcript, speaker: Speaker.User, text: heard });
    }
    const said = content.outputTranscription?.text;
    if (isNonEmptyString(said)) {
      events.push({ kind: SessionEventKind.Transcript, speaker: Speaker.Assistant, text: said });
    }

    for (const part of content.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (isNonEmptyString(data) && (part.inlineData?.mimeType ?? '').startsWith(AUDIO_MIME_PREFIX)) {
        events.push({ kind: SessionEventKind.Audio, samples: pcm16Base64ToFloat32(data) });
      }
    }

    if (content.turnComplete === true) events.push({ kind: SessionEventKind.TurnComplete });
  }

  for (const call of dto.toolCall?.functionCalls ?? []) {
    if (!isNonEmptyString(call.id) || !isNonEmptyString(call.name)) continue;

    events.push({ kind: SessionEventKind.ToolCall, call: { id: call.id, name: call.name, args: call.args ?? {} } });
  }

  const cancelled = (dto.toolCallCancellation?.ids ?? []).filter(isNonEmptyString);
  if (cancelled.length > 0) events.push({ kind: SessionEventKind.ToolCallCancelled, callIds: cancelled });

  const handle = dto.sessionResumptionUpdate?.newHandle;
  if (isNonEmptyString(handle)) events.push({ kind: SessionEventKind.Resumption, handle });

  if (dto.goAway !== undefined) {
    events.push({ kind: SessionEventKind.GoAway, timeLeftMs: parseTimeLeftMs(dto.goAway.timeLeft) });
  }

  const totalTokens = dto.usageMetadata?.totalTokenCount;
  if (typeof totalTokens === 'number') events.push({ kind: SessionEventKind.Usage, totalTokens });

  return events;
}

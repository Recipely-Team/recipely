import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import { ChatRole } from '@domain/drafts/chat-role';
import { CharConstants, ValueConstants } from '@core/constants';
import type { LiveServerMessageDto } from '@infrastructure/assistant/live/dtos/live-server-message-dto';
import { isNonEmptyString } from '@core/guards/type-guards';
import { pcm16Base64ToFloat32 } from '@infrastructure/assistant/live/pcm-codec';

/**
 * Turns one Live API frame into the events the app acts on.
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
 * - **Unknown frames map to nothing rather than to a failure.** The API adds
 *   message types over time and a session that fell over on an unrecognised
 *   one would be broken by a server-side release.
 */
const AUDIO_MIME_PREFIX = 'audio/';
const SECONDS_SUFFIX = 's';
const MS_PER_SECOND = 1000;

function parseTimeLeftMs(timeLeft: string | undefined): number {
  if (!isNonEmptyString(timeLeft)) return ValueConstants.zero;

  const seconds = Number.parseFloat(
    timeLeft.endsWith(SECONDS_SUFFIX) ? timeLeft.slice(ValueConstants.zero, -SECONDS_SUFFIX.length) : timeLeft,
  );
  return Number.isFinite(seconds) ? seconds * MS_PER_SECOND : ValueConstants.zero;
}

export function mapLiveServerMessage(dto: LiveServerMessageDto): AssistantSessionEventType[] {
  const events: AssistantSessionEventType[] = [];

  if (dto.setupComplete !== undefined) events.push({ kind: AssistantEventKind.Ready });

  const content = dto.serverContent;
  if (content !== undefined) {
    if (content.interrupted === true) events.push({ kind: AssistantEventKind.Interrupted });

    const heard = content.inputTranscription?.text;
    if (isNonEmptyString(heard)) {
      events.push({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: heard });
    }
    const said = content.outputTranscription?.text;
    if (isNonEmptyString(said)) {
      events.push({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: said });
    }

    for (const part of content.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (isNonEmptyString(data) && (part.inlineData?.mimeType ?? CharConstants.empty).startsWith(AUDIO_MIME_PREFIX)) {
        events.push({ kind: AssistantEventKind.Audio, samples: pcm16Base64ToFloat32(data) });
      }
    }

    if (content.turnComplete === true) events.push({ kind: AssistantEventKind.TurnComplete });
  }

  for (const call of dto.toolCall?.functionCalls ?? []) {
    if (!isNonEmptyString(call.id) || !isNonEmptyString(call.name)) continue;

    const action = call.args?.action;
    const arg = call.args?.arg;
    events.push({
      kind: AssistantEventKind.ToolCall,
      callId: call.id,
      action: isNonEmptyString(action) ? action : CharConstants.empty,
      ...(isNonEmptyString(arg) ? { arg } : {}),
    });
  }

  const handle = dto.sessionResumptionUpdate?.newHandle;
  if (isNonEmptyString(handle)) events.push({ kind: AssistantEventKind.Resumption, handle });

  if (dto.goAway !== undefined) {
    events.push({ kind: AssistantEventKind.GoAway, timeLeftMs: parseTimeLeftMs(dto.goAway.timeLeft) });
  }

  const totalTokens = dto.usageMetadata?.totalTokenCount;
  if (typeof totalTokens === 'number') events.push({ kind: AssistantEventKind.Usage, totalTokens });

  return events;
}

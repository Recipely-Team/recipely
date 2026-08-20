import { AssistantEventKind } from '@domain/assistant/assistant-event-kind';
import { ChatRole } from '@domain/drafts/chat-role';
import type { LiveServerMessageDto } from '@infrastructure/assistant/live/dtos/live-server-message-dto';
import { mapLiveServerMessage } from '@infrastructure/assistant/live/live-message-mapper';

describe('live-message-mapper', () => {
  const kinds = (dto: LiveServerMessageDto): string[] => mapLiveServerMessage(dto).map((e) => e.kind);

  // 0x0100 little-endian = 256, which is a non-zero sample either way round,
  // so this fixture would still pass if the codec's endianness flipped. The
  // codec's own test is what pins that down; this one only proves audio parts
  // become audio events.
  const audioPart = { inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.from([0, 1, 2, 3]).toString('base64') } };

  it('reports setupComplete as ready', () => {
    expect(kinds({ setupComplete: {} })).toEqual([AssistantEventKind.Ready]);
  });

  it('splits one frame into every event it carries', () => {
    const events = mapLiveServerMessage({
      serverContent: {
        outputTranscription: { text: 'Tarifi açıyorum' },
        modelTurn: { parts: [audioPart, audioPart] },
        turnComplete: true,
      },
    });

    expect(events.map((e) => e.kind)).toEqual([
      AssistantEventKind.Transcript,
      AssistantEventKind.Audio,
      AssistantEventKind.Audio,
      AssistantEventKind.TurnComplete,
    ]);
  });

  // The server can mark a turn interrupted and still include trailing chunks of
  // it in the same frame. Handling those before the flush enqueues exactly the
  // audio the interruption was meant to drop — the user talks over the
  // assistant and hears it finish the sentence anyway.
  it('puts interrupted ahead of audio that arrives in the same frame', () => {
    expect(kinds({ serverContent: { interrupted: true, modelTurn: { parts: [audioPart] } } })).toEqual([
      AssistantEventKind.Interrupted,
      AssistantEventKind.Audio,
    ]);
  });

  it('labels who was transcribed', () => {
    const events = mapLiveServerMessage({
      serverContent: { inputTranscription: { text: 'tavuk var' }, outputTranscription: { text: 'tamam' } },
    });

    expect(events).toEqual([
      { kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'tavuk var', final: false },
      { kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'tamam', final: false },
    ]);
  });

  // generationComplete fires when the model stops generating, which is before
  // the audio it generated has finished being sent. Ending the turn there cuts
  // the last words off.
  it('does not end the turn on generationComplete', () => {
    expect(kinds({ serverContent: { generationComplete: true } })).toEqual([]);
  });

  it('ignores a non-audio inline part rather than decoding it as samples', () => {
    expect(kinds({ serverContent: { modelTurn: { parts: [{ text: 'hello' }] } } })).toEqual([]);
    expect(
      kinds({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } } }),
    ).toEqual([]);
  });

  describe('tool calls', () => {
    it('carries the id and the action argument through', () => {
      expect(
        mapLiveServerMessage({
          toolCall: { functionCalls: [{ id: 'call-1', name: 'runAction', args: { action: 'generateRecipe', arg: 'tavuk' } }] },
        }),
      ).toEqual([{ kind: AssistantEventKind.ToolCall, callId: 'call-1', action: 'generateRecipe', arg: 'tavuk' }]);
    });

    it('omits arg when the model sent none', () => {
      const [event] = mapLiveServerMessage({
        toolCall: { functionCalls: [{ id: 'call-2', name: 'runAction', args: { action: 'stop' } }] },
      });

      expect(event).toEqual({ kind: AssistantEventKind.ToolCall, callId: 'call-2', action: 'stop' });
    });

    // An action the app does not know still has to reach the registry: it is
    // the only thing that can answer the call, and a Live session hangs waiting
    // for a functionResponse it never gets.
    it('still emits a call whose action is unrecognised', () => {
      expect(
        kinds({ toolCall: { functionCalls: [{ id: 'call-3', name: 'runAction', args: { action: 'launchRocket' } }] } }),
      ).toEqual([AssistantEventKind.ToolCall]);
    });

    it('drops a call with no id, because nothing could answer it', () => {
      expect(kinds({ toolCall: { functionCalls: [{ name: 'runAction', args: { action: 'stop' } }] } })).toEqual([]);
    });

    it('reports every call in a frame', () => {
      expect(
        kinds({
          toolCall: {
            functionCalls: [
              { id: 'a', name: 'runAction', args: { action: 'navigate' } },
              { id: 'b', name: 'runAction', args: { action: 'search' } },
            ],
          },
        }),
      ).toEqual([AssistantEventKind.ToolCall, AssistantEventKind.ToolCall]);
    });
  });

  describe('goAway', () => {
    // timeLeft is a protobuf duration string, not a number. Parsing "9.5s" as
    // one yields NaN, and a resumption scheduled against NaN never happens.
    it('reads the duration string as milliseconds', () => {
      expect(mapLiveServerMessage({ goAway: { timeLeft: '9.5s' } })).toEqual([
        { kind: AssistantEventKind.GoAway, timeLeftMs: 9500 },
      ]);
    });

    it('treats a missing or unparseable duration as no time left', () => {
      expect(mapLiveServerMessage({ goAway: {} })).toEqual([{ kind: AssistantEventKind.GoAway, timeLeftMs: 0 }]);
      expect(mapLiveServerMessage({ goAway: { timeLeft: 'soon' } })).toEqual([
        { kind: AssistantEventKind.GoAway, timeLeftMs: 0 },
      ]);
    });
  });

  it('reports a resumption handle', () => {
    expect(mapLiveServerMessage({ sessionResumptionUpdate: { newHandle: 'h-1', resumable: true } })).toEqual([
      { kind: AssistantEventKind.Resumption, handle: 'h-1' },
    ]);
  });

  it('ignores a resumption update that carries no handle', () => {
    expect(kinds({ sessionResumptionUpdate: { resumable: true } })).toEqual([]);
  });

  it('reports usage, including a zero count', () => {
    expect(mapLiveServerMessage({ usageMetadata: { totalTokenCount: 0 } })).toEqual([
      { kind: AssistantEventKind.Usage, totalTokens: 0 },
    ]);
  });

  // The API gains message types over time; a session that failed on one it did
  // not recognise would be broken by a server-side release, with no app change.
  it('maps an unrecognised frame to nothing', () => {
    expect(kinds({} as LiveServerMessageDto)).toEqual([]);
    expect(kinds({ somethingNew: true } as LiveServerMessageDto)).toEqual([]);
  });
});

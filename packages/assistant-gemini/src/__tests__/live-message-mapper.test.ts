import { SessionEventKind, Speaker } from '@live-assistant/core';
import type { LiveServerMessageDto } from '../dtos/live-server-message-dto';
import { mapLiveServerMessage } from '../live-message-mapper';

describe('live-message-mapper', () => {
  const kinds = (dto: LiveServerMessageDto): string[] => mapLiveServerMessage(dto).map((e) => e.kind);

  // 0x0100 little-endian = 256, which is a non-zero sample either way round,
  // so this fixture would still pass if the codec's endianness flipped. The
  // codec's own test is what pins that down; this one only proves audio parts
  // become audio events.
  const audioPart = { inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.from([0, 1, 2, 3]).toString('base64') } };

  it('reports setupComplete as ready', () => {
    expect(kinds({ setupComplete: {} })).toEqual([SessionEventKind.Ready]);
  });

  it('splits one frame into every event it carries', () => {
    const events = mapLiveServerMessage({
      serverContent: {
        outputTranscription: { text: 'Opening the file' },
        modelTurn: { parts: [audioPart, audioPart] },
        turnComplete: true,
      },
    });

    expect(events.map((e) => e.kind)).toEqual([
      SessionEventKind.Transcript,
      SessionEventKind.Audio,
      SessionEventKind.Audio,
      SessionEventKind.TurnComplete,
    ]);
  });

  // The server can mark a turn interrupted and still include trailing chunks of
  // it in the same frame. Handling those before the flush enqueues exactly the
  // audio the interruption was meant to drop — the user talks over the
  // assistant and hears it finish the sentence anyway.
  it('puts interrupted ahead of audio that arrives in the same frame', () => {
    expect(kinds({ serverContent: { interrupted: true, modelTurn: { parts: [audioPart] } } })).toEqual([
      SessionEventKind.Interrupted,
      SessionEventKind.Audio,
    ]);
  });

  it('labels who was transcribed', () => {
    const events = mapLiveServerMessage({
      serverContent: { inputTranscription: { text: 'what time is it' }, outputTranscription: { text: 'let me check' } },
    });

    expect(events).toEqual([
      { kind: SessionEventKind.Transcript, speaker: Speaker.User, text: 'what time is it' },
      { kind: SessionEventKind.Transcript, speaker: Speaker.Assistant, text: 'let me check' },
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
    it('carries the id, the name and the raw args through', () => {
      expect(
        mapLiveServerMessage({
          toolCall: { functionCalls: [{ id: 'call-1', name: 'setAlarm', args: { time: '07:30', repeat: false } }] },
        }),
      ).toEqual([
        { kind: SessionEventKind.ToolCall, call: { id: 'call-1', name: 'setAlarm', args: { time: '07:30', repeat: false } } },
      ]);
    });

    it('gives a call with no args an empty object, so a handler can read it without a guard', () => {
      const [event] = mapLiveServerMessage({ toolCall: { functionCalls: [{ id: 'call-2', name: 'stop' }] } });

      expect(event).toEqual({ kind: SessionEventKind.ToolCall, call: { id: 'call-2', name: 'stop', args: {} } });
    });

    // The package does not know what a consumer declared, and a Live session
    // hangs waiting for a functionResponse it never gets — so an unfamiliar
    // name still has to reach the code that can answer it.
    it('still emits a call to a tool the package has never heard of', () => {
      expect(kinds({ toolCall: { functionCalls: [{ id: 'call-3', name: 'launchRocket' }] } })).toEqual([
        SessionEventKind.ToolCall,
      ]);
    });

    it('drops a call with no id or no name, because nothing could answer it', () => {
      expect(kinds({ toolCall: { functionCalls: [{ name: 'stop' }, { id: 'x' }] } })).toEqual([]);
    });

    it('reports every call in a frame', () => {
      expect(
        kinds({
          toolCall: {
            functionCalls: [
              { id: 'a', name: 'navigate' },
              { id: 'b', name: 'search' },
            ],
          },
        }),
      ).toEqual([SessionEventKind.ToolCall, SessionEventKind.ToolCall]);
    });

    it('reports withdrawn calls by id', () => {
      expect(mapLiveServerMessage({ toolCallCancellation: { ids: ['a', 7, '', 'b'] } })).toEqual([
        { kind: SessionEventKind.ToolCallCancelled, callIds: ['a', 'b'] },
      ]);
    });
  });

  describe('goAway', () => {
    // timeLeft is a protobuf duration string, not a number. Parsing "9.5s" as
    // one yields NaN, and a resumption scheduled against NaN never happens.
    it('reads the duration string as milliseconds', () => {
      expect(mapLiveServerMessage({ goAway: { timeLeft: '9.5s' } })).toEqual([
        { kind: SessionEventKind.GoAway, timeLeftMs: 9500 },
      ]);
    });

    it('treats a missing or unparseable duration as no time left', () => {
      expect(mapLiveServerMessage({ goAway: {} })).toEqual([{ kind: SessionEventKind.GoAway, timeLeftMs: 0 }]);
      expect(mapLiveServerMessage({ goAway: { timeLeft: 'soon' } })).toEqual([
        { kind: SessionEventKind.GoAway, timeLeftMs: 0 },
      ]);
    });
  });

  it('reports a resumption handle', () => {
    expect(mapLiveServerMessage({ sessionResumptionUpdate: { newHandle: 'h-1', resumable: true } })).toEqual([
      { kind: SessionEventKind.Resumption, handle: 'h-1' },
    ]);
  });

  it('ignores a resumption update that carries no handle', () => {
    expect(kinds({ sessionResumptionUpdate: { resumable: true } })).toEqual([]);
  });

  it('reports usage, including a zero count', () => {
    expect(mapLiveServerMessage({ usageMetadata: { totalTokenCount: 0 } })).toEqual([
      { kind: SessionEventKind.Usage, totalTokens: 0 },
    ]);
  });

  // The API gains message types over time; a session that failed on one it did
  // not recognise would be broken by a server-side release, with no app change.
  it('maps an unrecognised frame to nothing', () => {
    expect(kinds({} as LiveServerMessageDto)).toEqual([]);
    expect(kinds({ somethingNew: true } as LiveServerMessageDto)).toEqual([]);
  });
});

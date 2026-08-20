import { AssistantEventKind } from '@domain/assistant/assistant-event-kind';
import type { AssistantSessionEventType } from '@domain/assistant/assistant-session-event';
import { GeminiLiveSession } from '@infrastructure/assistant/live/gemini-live-session';
import type { LiveSessionCredentials } from '@domain/assistant/live-session-credentials';

/**
 * A WebSocket with the wire replaced by test control. Only the four handlers
 * and the two methods the session touches are implemented, so a call the
 * session should not be making fails here rather than passing quietly.
 */
class FakeSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = FakeSocket.OPEN;
  readonly sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  open(): void {
    this.onopen?.();
  }

  deliver(frame: unknown): void {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  deliverRaw(data: unknown): void {
    this.onmessage?.({ data });
  }

  fail(): void {
    this.onerror?.();
  }

  parsedSends(): Record<string, never>[] {
    return this.sent.map((s) => JSON.parse(s));
  }
}

describe('GeminiLiveSession', () => {
  const credentials: LiveSessionCredentials = {
    token: 't',
    model: 'models/gemini-flash-latest',
    wsUrl: 'wss://example.test/live',
    expiresAt: '2026-08-20T00:00:00Z',
    budgetRemainingSec: 600,
  };

  // Helper kept explicit rather than clever: every test needs a connected
  // session, and the handshake is two steps that are easy to get out of order.
  const connected = async () => {
    const sockets: FakeSocket[] = [];
    const session = new GeminiLiveSession(() => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    });
    const events: AssistantSessionEventType[] = [];
    session.subscribe((event) => events.push(event));

    const pending = session.connect(credentials, 'tr-TR');
    const socket = sockets[0]!;
    socket.open();
    socket.deliver({ setupComplete: {} });
    const result = await pending;

    return { session, socket, sockets, events, result };
  };

  it('sends the setup frame as soon as the socket opens', async () => {
    const { socket } = await connected();
    const [first] = socket.parsedSends() as unknown as { setup?: { model?: string } }[];

    expect(first!.setup?.model).toBe('models/gemini-flash-latest');
  });

  // The socket opens before the server has accepted the model, the tool list or
  // the modality, and audio sent in that window is discarded silently rather
  // than rejected. Resolving on open would hand the caller a session that eats
  // the first second of every conversation.
  it('does not resolve until the server acknowledges setup', async () => {
    const sockets: FakeSocket[] = [];
    const session = new GeminiLiveSession(() => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    });

    let settled = false;
    const pending = session.connect(credentials, 'tr-TR').then((r) => {
      settled = true;
      return r;
    });
    sockets[0]!.open();
    await Promise.resolve();

    expect(settled).toBe(false);

    sockets[0]!.deliver({ setupComplete: {} });
    expect((await pending).ok).toBe(true);
  });

  it('fails when the socket errors before setup', async () => {
    const sockets: FakeSocket[] = [];
    const session = new GeminiLiveSession(() => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    });

    const pending = session.connect(credentials, 'tr-TR');
    sockets[0]!.fail();

    expect((await pending).ok).toBe(false);
  });

  it('encodes microphone frames as base64 PCM at the input rate', async () => {
    const { session, socket } = await connected();
    socket.sent.length = 0;

    session.sendAudio(new Float32Array([0, 0.5, -0.5]));
    const [frame] = socket.parsedSends() as unknown as {
      realtimeInput?: { audio?: { data?: string; mimeType?: string } };
    }[];

    expect(frame!.realtimeInput?.audio?.mimeType).toBe('audio/pcm;rate=16000');
    expect(frame!.realtimeInput?.audio?.data).toBe(
      Buffer.from(new Int16Array([0, 16384, -16384]).buffer).toString('base64'),
    );
  });

  it('says nothing for an empty audio frame', async () => {
    const { session, socket } = await connected();
    socket.sent.length = 0;

    session.sendAudio(new Float32Array());

    expect(socket.sent).toEqual([]);
  });

  // A live session stops and waits for a response to every function call it
  // makes, so a call left unanswered hangs the conversation with no error
  // anywhere — and a response under the wrong tool name is the same silence.
  it('answers a tool call under the declared tool name', async () => {
    const { session, socket } = await connected();
    socket.sent.length = 0;

    session.respondToTool('call-9', { ok: true, ctx: 'screen=createRecipe' });
    const [frame] = socket.parsedSends() as unknown as {
      toolResponse?: { functionResponses?: { id?: string; name?: string; response?: unknown }[] };
    }[];

    expect(frame!.toolResponse?.functionResponses?.[0]).toEqual({
      id: 'call-9',
      name: 'runAction',
      response: { ok: true, ctx: 'screen=createRecipe' },
    });
  });

  it('drops sends once the socket has closed instead of throwing', async () => {
    const { session, socket } = await connected();
    session.close();
    socket.sent.length = 0;

    expect(() => session.sendAudio(new Float32Array([0.1]))).not.toThrow();
    expect(socket.sent).toEqual([]);
  });

  it('forwards every event a frame carries, in the mapper\'s order', async () => {
    const { socket, events } = await connected();
    events.length = 0;

    socket.deliver({
      serverContent: {
        interrupted: true,
        modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAAA' } }] },
      },
    });

    expect(events.map((e) => e.kind)).toEqual([AssistantEventKind.Interrupted, AssistantEventKind.Audio]);
  });

  it('remembers the resumption handle so a goAway can be survived', async () => {
    const { session, socket } = await connected();

    expect(session.lastResumptionHandle).toBeNull();

    socket.deliver({ sessionResumptionUpdate: { newHandle: 'handle-1', resumable: true } });

    expect(session.lastResumptionHandle).toBe('handle-1');
  });

  it('sends the handle back when reconnecting after a goAway', async () => {
    const { session, sockets } = await connected();

    const pending = session.connect(credentials, 'tr-TR', 'handle-1');
    const next = sockets[1]!;
    next.open();
    next.deliver({ setupComplete: {} });
    await pending;

    const [first] = next.parsedSends() as unknown as { setup?: { sessionResumption?: unknown } }[];

    expect(first!.setup?.sessionResumption).toEqual({ handle: 'handle-1' });
  });

  // A reconnect closes the old socket and opens the new one in the same tick.
  // With a single `closing` flag, the old socket's onclose ran after the new
  // connection had already reset it, and a deliberate close was reported to the
  // UI as a dropped connection — which is what triggers a reconnect prompt.
  it('reports a deliberate close as expected, even during a reconnect', async () => {
    const { session, events } = await connected();
    events.length = 0;

    void session.connect(credentials, 'tr-TR');

    expect(events).toEqual([{ kind: AssistantEventKind.Closed, expected: true }]);
  });

  it('reports a dropped connection as unexpected', async () => {
    const { socket, events } = await connected();
    events.length = 0;

    socket.onclose?.();

    expect(events).toEqual([{ kind: AssistantEventKind.Closed, expected: false }]);
  });

  it('survives a frame it cannot parse', async () => {
    const { socket, events } = await connected();
    events.length = 0;

    socket.deliverRaw('not json at all');
    socket.deliverRaw(new ArrayBuffer(4));
    socket.deliver({ usageMetadata: { totalTokenCount: 12 } });

    expect(events).toEqual([{ kind: AssistantEventKind.Usage, totalTokens: 12 }]);
  });

  // One screen's bad render must not take down the audio session, so a throwing
  // listener is contained rather than propagated to the socket handler.
  it('keeps delivering to other listeners when one throws', async () => {
    const { session, socket } = await connected();
    const seen: string[] = [];
    session.subscribe(() => {
      throw new Error('render failed');
    });
    session.subscribe((event) => seen.push(event.kind));

    socket.deliver({ usageMetadata: { totalTokenCount: 3 } });

    expect(seen).toEqual([AssistantEventKind.Usage]);
  });

  it('stops delivering after unsubscribe', async () => {
    const { session, socket } = await connected();
    const seen: string[] = [];
    const unsubscribe = session.subscribe((event) => seen.push(event.kind));

    unsubscribe();
    socket.deliver({ usageMetadata: { totalTokenCount: 3 } });

    expect(seen).toEqual([]);
  });
});

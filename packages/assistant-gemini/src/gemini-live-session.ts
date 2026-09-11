import { AssistantFailureCode, SessionEventKind, fail, float32ToPcm16Base64, ok } from '@live-assistant/core';
import type { AssistantFailure, AssistantSession, AudioFormat, Result, SessionEvent, ToolCall } from '@live-assistant/core';
import type { LiveServerMessageDto } from './dtos/live-server-message-dto';
import type { GeminiLiveCredentials } from './gemini-live-credentials';
import { isString } from './guards';
import { LiveProtocol } from './live-protocol';
import { mapLiveServerMessage } from './live-message-mapper';
import { toLiveSetupRequest } from './live-setup-request';

/**
 * The Live API transport: one WebSocket, its setup handshake, and the JSON
 * frames in both directions.
 *
 * @remarks
 * - **The token rides on the URL, and nothing else authenticates.** A browser
 *   WebSocket cannot set a header, so the credential is a query parameter or it
 *   is nowhere. Opened without it the handshake still completes and the server
 *   then closes the socket — which looks, from the client, exactly like a
 *   connection that hangs.
 * - **Connected means `setupComplete`, not open.** The socket opens before the
 *   server has accepted the model, the tool list or the modality, and audio
 *   sent in that window is discarded silently rather than rejected. `connect`
 *   resolves on the acknowledgement, so a caller that awaits it can start the
 *   microphone knowing the frames will land.
 * - **Listeners are notified in frame order, and one frame yields several
 *   events.** The mapper decides that order — notably `interrupted` ahead of
 *   any audio beside it — so this class must not reorder or batch them.
 * - **A listener that throws must not kill the socket.** One consumer's bad
 *   render would otherwise take down the audio session and every other
 *   listener with it.
 * - **The resumption handle is remembered but never acted on here.** It cannot
 *   be: a handle put in the setup frame is discarded, so continuing a session
 *   means minting a new token with it. Reconnecting also asks whether the user
 *   still wants to be talking, which is a policy question either way; this
 *   class only keeps the handle and reports the `goAway` that makes it matter.
 * - **Whether a close was expected is tracked per socket**, not in a field. A
 *   reconnect closes the old socket and opens a new one in the same tick, and a
 *   single flag was read by the old socket's `onclose` after the new
 *   connection had already reset it — reporting a deliberate close as a drop.
 */
// Injected so the whole state machine can be driven against a fake, which is
// the only way any of this is testable without a network and a key.
type SocketFactory = (url: string) => WebSocket;

const SOCKET_OPEN = 1;
const ARRAY_BUFFER = 'arraybuffer';
/**
 * How long a socket may take to reach `setupComplete` before it is abandoned.
 *
 * Without it a socket that opened, took the setup frame and then said nothing
 * left `connect` pending forever — and a caller that opens the microphone
 * first would hold the recording device open with nothing counting against it.
 */
const CONNECT_TIMEOUT_MS = 15_000;
const QUERY_START = '?';
const QUERY_JOIN = '&';

/**
 * The socket URL with the session's credential on it.
 *
 * The token is the ONLY thing that authenticates this connection — there is no
 * header to put it in, because a browser WebSocket cannot set one. Opened
 * without it the socket completes its handshake and is then closed by the
 * server, which reads as "connecting, and then nothing".
 *
 * `access_token` is deliberately NOT percent-encoded. The name contains a
 * slash (`auth_tokens/…`), and encoding it produced a socket the server
 * refused — measured against the live API, along with the `key=` spelling,
 * which it also refuses.
 */
function authenticatedUrl(credentials: GeminiLiveCredentials): string {
  const wsUrl = credentials.wsUrl ?? LiveProtocol.constrainedWsUrl;
  const separator = wsUrl.includes(QUERY_START) ? QUERY_JOIN : QUERY_START;
  return `${wsUrl}${separator}access_token=${credentials.token}`;
}

/**
 * Reads one incoming frame as text.
 *
 * The Live API sends its JSON as BINARY WebSocket frames, not text ones — every
 * frame, including `setupComplete`. A transport that accepted only strings
 * silently received nothing at all, and its unit tests passed because a fake
 * socket naturally sends strings. `binaryType` is set to `arraybuffer` so this
 * stays synchronous; a Blob would have to be awaited, and the mapper's ordering
 * guarantee does not survive an await between frames.
 */
function decodeFrame(data: unknown): string | null {
  if (isString(data)) return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data.buffer as ArrayBuffer);
  return null;
}

export class GeminiLiveSession implements AssistantSession<GeminiLiveCredentials> {
  readonly audioFormat: AudioFormat = {
    inputSampleRate: LiveProtocol.inputSampleRate,
    outputSampleRate: LiveProtocol.outputSampleRate,
  };

  private socket: WebSocket | null = null;
  private readonly listeners = new Set<(event: SessionEvent) => void>();
  private readonly deliberatelyClosed = new WeakSet<WebSocket>();
  private resumptionHandle: string | null = null;

  constructor(private readonly createSocket: SocketFactory = (url) => new WebSocket(url)) {}

  /** The latest handle a new token can be minted with to continue after a `goAway`. */
  get lastResumptionHandle(): string | null {
    return this.resumptionHandle;
  }

  connect(credentials: GeminiLiveCredentials): Promise<Result<void, AssistantFailure>> {
    this.close();

    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        // Settled BEFORE closing: a runtime whose `close()` fires `onclose`
        // synchronously would otherwise answer with "closed before ready" and
        // this reason would never be the one anybody reads.
        settle(fail({ code: AssistantFailureCode.ConnectTimedOut }));
        this.close();
      }, CONNECT_TIMEOUT_MS);

      const settle = (result: Result<void, AssistantFailure>): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      const socket = this.createSocket(authenticatedUrl(credentials));
      // The server sends its JSON in BINARY frames. Without this the runtime
      // hands them over as Blob, which cannot be read synchronously.
      socket.binaryType = ARRAY_BUFFER;
      this.socket = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify(toLiveSetupRequest({ model: credentials.model })));
      };

      socket.onmessage = (event) => {
        for (const mapped of this.parse(event.data)) {
          if (mapped.kind === SessionEventKind.Ready) settle(ok(undefined));
          if (mapped.kind === SessionEventKind.Resumption) this.resumptionHandle = mapped.handle;
          this.emit(mapped);
        }
      };

      socket.onerror = () => {
        settle(fail({ code: AssistantFailureCode.SocketFailed }));
      };

      socket.onclose = () => {
        const expected = this.deliberatelyClosed.has(socket);
        if (this.socket === socket) this.socket = null;
        settle(fail({ code: AssistantFailureCode.ClosedBeforeReady }));
        this.emit({ kind: SessionEventKind.Closed, expected });
      };
    });
  }

  sendAudio(samples: Float32Array<ArrayBuffer>): void {
    if (samples.length === 0) return;
    // Checked before encoding, not after: capture now starts before the socket
    // does, so every frame in that window used to be converted to base64 and
    // then dropped by `send`.
    if (!this.isOpen) return;

    this.send({
      realtimeInput: { audio: { data: float32ToPcm16Base64(samples), mimeType: LiveProtocol.inputAudioMime } },
    });
  }

  sendText(text: string): void {
    if (text === '') return;

    this.send({ clientContent: { turns: [{ role: LiveProtocol.userRole, parts: [{ text }] }], turnComplete: true } });
  }

  respondToTool(call: Pick<ToolCall, 'id' | 'name'>, response: Readonly<Record<string, unknown>>): void {
    this.send({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } });
  }

  subscribe(listener: (event: SessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket === null) return;

    this.deliberatelyClosed.add(socket);
    socket.close();
  }

  private get isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === SOCKET_OPEN;
  }

  private send(message: unknown): void {
    // A frame produced after the socket went away is dropped: it is one frame
    // of audio, and there is nothing a caller could usefully do about it.
    const socket = this.socket;
    if (socket === null || socket.readyState !== SOCKET_OPEN) return;

    socket.send(JSON.stringify(message));
  }

  private parse(data: unknown): SessionEvent[] {
    const text = decodeFrame(data);
    if (text === null) return [];

    try {
      return mapLiveServerMessage(JSON.parse(text) as LiveServerMessageDto);
    } catch {
      // A frame we cannot read is not a reason to drop a live conversation.
      return [];
    }
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // One listener's failure must not take down the audio session.
      }
    }
  }
}

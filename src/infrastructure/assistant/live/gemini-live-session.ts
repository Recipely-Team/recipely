import { AssistantEventKind } from '@domain/assistant/assistant-event-kind';
import type { AssistantSessionEventType } from '@domain/assistant/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/assistant-session-interface';
import { ChatRole } from '@domain/drafts/chat-role';
import { CharConstants, ValueConstants } from '@core/constants';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import { float32ToPcm16Base64 } from '@infrastructure/assistant/live/pcm-codec';
import type { LiveServerMessageDto } from '@infrastructure/assistant/live/dtos/live-server-message-dto';
import type { LiveSessionCredentials } from '@domain/assistant/live-session-credentials';
import { LiveProtocol } from '@infrastructure/assistant/live/live-protocol';
import { mapLiveServerMessage } from '@infrastructure/assistant/live/live-message-mapper';
import { NetworkFailure } from '@core/failure/kinds/network-failure';
import type { Result } from '@core/result/result';
import { toLiveSetupRequest } from '@infrastructure/assistant/live/live-setup-request-mapper';

/**
 * The Live API transport: one WebSocket, its setup handshake, and the JSON
 * frames in both directions.
 *
 * @remarks
 * - **Connected means `setupComplete`, not open.** The socket opens before the
 *   server has accepted the model, the tool list or the modality, and audio
 *   sent in that window is discarded silently rather than rejected. `connect`
 *   resolves on the acknowledgement, so a caller that awaits it can start the
 *   microphone knowing the frames will land.
 * - **Listeners are notified in frame order, and one frame yields several
 *   events.** The mapper decides that order — notably `interrupted` ahead of
 *   any audio beside it — so this class must not reorder or batch them.
 * - **A listener that throws must not kill the socket.** One screen's bad
 *   render would otherwise take down the audio session and every other
 *   listener with it.
 * - **The resumption handle is remembered but never acted on here.**
 *   Reconnecting asks whether the user still wants to be talking, which is a
 *   policy question for the application layer; this class only keeps the handle
 *   and reports the `goAway` that makes it relevant.
 * - **Whether a close was expected is tracked per socket**, not in a field. A
 *   reconnect closes the old socket and opens a new one in the same tick, and a
 *   single flag was read by the old socket's `onclose` after the new
 *   connection had already reset it — reporting a deliberate close as a drop.
 */
// Injected so the whole state machine can be driven against a fake, which is
// the only way any of this is testable without a network and a key.
type SocketFactory = (url: string) => WebSocket;

const SOCKET_OPEN = 1;

export class GeminiLiveSession implements AssistantSessionInterface {
  private socket: WebSocket | null = null;
  private readonly listeners = new Set<(event: AssistantSessionEventType) => void>();
  private readonly deliberatelyClosed = new WeakSet<WebSocket>();
  private resumptionHandle: string | null = null;

  constructor(private readonly createSocket: SocketFactory = (url) => new WebSocket(url)) {}

  /** The handle the application layer needs to continue after a `goAway`. */
  get lastResumptionHandle(): string | null {
    return this.resumptionHandle;
  }

  connect(
    credentials: LiveSessionCredentials,
    languageCode: string,
    resumptionHandle?: string,
  ): Promise<Result<void, Failure>> {
    this.close();

    return new Promise((resolve) => {
      let settled = false;
      const settle = (result: Result<void, Failure>): void => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const socket = this.createSocket(credentials.wsUrl);
      this.socket = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify(
            toLiveSetupRequest({
              model: credentials.model,
              languageCode,
              ...(resumptionHandle === undefined ? {} : { resumptionHandle }),
            }),
          ),
        );
      };

      socket.onmessage = (event) => {
        for (const mapped of this.parse(event.data)) {
          if (mapped.kind === AssistantEventKind.Ready) settle({ ok: true, value: undefined });
          if (mapped.kind === AssistantEventKind.Resumption) this.resumptionHandle = mapped.handle;
          this.emit(mapped);
        }
      };

      socket.onerror = () => {
        settle({ ok: false, failure: new NetworkFailure(DiagnosticMessage.assistant.sessionSocketFailed) });
      };

      socket.onclose = () => {
        const expected = this.deliberatelyClosed.has(socket);
        if (this.socket === socket) this.socket = null;
        settle({ ok: false, failure: new NetworkFailure(DiagnosticMessage.assistant.sessionClosedBeforeReady) });
        this.emit({ kind: AssistantEventKind.Closed, expected });
      };
    });
  }

  sendAudio(samples: Float32Array<ArrayBuffer>): void {
    if (samples.length === ValueConstants.zero) return;

    this.send({
      realtimeInput: { audio: { data: float32ToPcm16Base64(samples), mimeType: LiveProtocol.inputAudioMime } },
    });
  }

  sendText(text: string): void {
    if (text === CharConstants.empty) return;

    this.send({ clientContent: { turns: [{ role: ChatRole.User, parts: [{ text }] }], turnComplete: true } });
  }

  respondToTool(callId: string, response: Record<string, unknown>): void {
    this.send({
      toolResponse: { functionResponses: [{ id: callId, name: LiveProtocol.toolName, response }] },
    });
  }

  subscribe(listener: (event: AssistantSessionEventType) => void): () => void {
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

  private send(message: unknown): void {
    // A frame produced after the socket went away is dropped: it is one frame
    // of audio, and there is nothing a screen could usefully do about it.
    if (this.socket === null || this.socket.readyState !== SOCKET_OPEN) return;

    this.socket.send(JSON.stringify(message));
  }

  private parse(data: unknown): AssistantSessionEventType[] {
    if (typeof data !== 'string') return [];

    try {
      return mapLiveServerMessage(JSON.parse(data) as LiveServerMessageDto);
    } catch {
      // A frame we cannot read is not a reason to drop a live conversation.
      return [];
    }
  }

  private emit(event: AssistantSessionEventType): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // One listener's failure must not take down the audio session.
      }
    }
  }
}

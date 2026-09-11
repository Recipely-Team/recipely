import type { AudioFormat } from '../audio/audio-format';
import type { AssistantFailure } from '../result/failure';
import type { Result } from '../result/result';
import type { ToolCall } from '../tools/tool-call';
import type { SessionEvent } from './session-event';

/**
 * One live voice session with a provider — the port every provider adapter
 * implements and everything above it (audio, state, widget) is written against.
 *
 * @remarks
 * - **Provider-neutral.** Nothing here names a provider: switching providers is
 *   choosing another implementation, not changing a caller. `Connection` is the
 *   adapter's own shape (a token, a model, whatever its provider needs).
 * - **`connect` resolves when the provider is READY, not when a socket opens.**
 *   Audio sent before that is discarded by providers without an error.
 * - **Every tool call must be answered**, or the model's turn stalls.
 */
export interface AssistantSession<Connection> {
  /** The rates to capture at and to play back at. */
  readonly audioFormat: AudioFormat;

  connect(connection: Connection): Promise<Result<void, AssistantFailure>>;

  /** Streams one frame of mono microphone audio at `audioFormat.inputSampleRate`. */
  sendAudio(samples: Float32Array<ArrayBuffer>): void;

  /** Sends a typed turn. */
  sendText(text: string): void;

  /** Answers a `toolCall` event. `call` is the event's call, or at least its id and name. */
  respondToTool(call: Pick<ToolCall, 'id' | 'name'>, response: Readonly<Record<string, unknown>>): void;

  /** Registers a listener; returns the function that removes it. */
  subscribe(listener: (event: SessionEvent) => void): () => void;

  /** Closes the session. Safe to call when nothing is open. */
  close(): void;
}

import type { AssistantSessionEventType } from '@domain/assistant/assistant-session-event';
import type { Failure } from '@core/failure/failure';
import type { LiveSessionCredentials } from '@domain/assistant/live-session-credentials';
import type { Result } from '@core/result/result';

/**
 * Port for the live voice transport.
 *
 * @remarks
 * - **There is no `interrupt` here, and that is a decision.** Interruption is
 *   detected by the server's voice-activity detection the moment the user's
 *   audio arrives — the client does not request it. What the client owes the
 *   user is silence, which is the player's `flush`, not a message on this
 *   socket. A method here would have implied the transport could stop a turn
 *   on demand, and callers would have used it instead of flushing.
 * - **The credentials are the configuration.** An ephemeral token carries the
 *   setup it was minted with, and the server discards whatever the client puts
 *   in its own setup frame — so a `connect` that accepted a system instruction
 *   or a tool list would be offering a lie.
 * - **Sends do not resolve.** Audio is produced on the hardware's clock and a
 *   caller that awaited each frame would stall the capture loop; a send that
 *   arrives after the socket closed is dropped, because there is nothing a
 *   screen could usefully do about one frame of audio.
 * - **`respondToTool` is not optional politeness.** A live session stops and
 *   waits for a response to every function call it makes, so a call left
 *   unanswered hangs the conversation with no error anywhere.
 */
export interface AssistantSessionInterface {
  /**
   * Opens the socket, resolving once the server has acknowledged setup.
   *
   * There is nothing to configure here: the session runs on the setup its
   * token was minted with, so language and resumption are arguments to
   * `AssistantTokenRepositoryInterface.mintSession`, not to this.
   */
  connect(credentials: LiveSessionCredentials): Promise<Result<void, Failure>>;

  /** Streams one frame of 16 kHz mono microphone audio. */
  sendAudio(samples: Float32Array<ArrayBuffer>): void;

  /** Sends a typed turn, for the text mode and for on-screen suggestions. */
  sendText(text: string): void;

  /** Answers a function call. Every call must be answered or the turn stalls. */
  respondToTool(callId: string, response: Record<string, unknown>): void;

  /** Registers a listener and returns the function that removes it. */
  subscribe(listener: (event: AssistantSessionEventType) => void): () => void;

  /** Closes the socket. Safe to call when nothing is open. */
  close(): void;
}

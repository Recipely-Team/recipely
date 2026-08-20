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
   * Opens the socket and configures the session, resolving once the server has
   * accepted the setup. `resumptionHandle` continues a session the server
   * asked us to leave, which avoids paying for setup and context again.
   */
  connect(
    credentials: LiveSessionCredentials,
    languageCode: string,
    resumptionHandle?: string,
  ): Promise<Result<void, Failure>>;

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

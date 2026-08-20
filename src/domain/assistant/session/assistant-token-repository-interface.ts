import type { Failure } from '@core/failure/failure';
import type { AssistantSessionGrantType } from '@domain/assistant/session/assistant-session-grant';
import type { Result } from '@core/result/result';

/**
 * Port for minting a voice session against our backend.
 *
 * @remarks
 * - **This is where the session is configured, not on the socket.** An
 *   ephemeral token carries the setup it was minted with, and that setup is
 *   what the live session runs on — the client's own setup frame is discarded.
 *   So the system instruction, the tool list, the action enum, the modality and
 *   the transcription config are all decided here, server-side, and the app
 *   never states them.
 * - **`languageCode` is a mint argument for the same reason.** The speech
 *   config is part of the minted setup; passing it on the socket does nothing.
 * - **`resumptionHandle` continues a session the server asked us to leave.** It
 *   too has to be minted in, so surviving a `goAway` costs one backend call —
 *   which is also the point at which the daily budget is re-checked.
 * - **A refusal is not a failure.** Out of budget is the expected answer several
 *   times a day and the screen answers it by offering the text mode, so it
 *   arrives as a successful `Denied` grant. The failure channel means the
 *   backend could not be reached or could not reach Google.
 */
export interface AssistantTokenRepositoryInterface {
  /**
   * Asks the backend for a session. Answers a grant OR a denial — both are
   * successes; the failure channel is for a server that could not be reached.
   */
  mintSession(
    languageCode: string,
    resumptionHandle?: string,
  ): Promise<Result<AssistantSessionGrantType, Failure>>;

  /**
   * Reports the seconds spent since the last heartbeat and answers how many
   * remain. A delta, never a running total: a client trusted to remember its
   * total across a reconnect would refund itself by forgetting.
   */
  reportUsage(seconds: number): Promise<Result<number, Failure>>;
}

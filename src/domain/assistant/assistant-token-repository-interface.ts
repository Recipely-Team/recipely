import type { Failure } from '@core/failure/failure';
import type { LiveSessionCredentials } from '@domain/assistant/live-session-credentials';
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
 * - **A refusal is an ordinary failure.** Out of budget is the expected answer
 *   several times a day, and the screen's response is to offer the text mode,
 *   not to show an error.
 */
export interface AssistantTokenRepositoryInterface {
  mintSession(
    languageCode: string,
    resumptionHandle?: string,
  ): Promise<Result<LiveSessionCredentials, Failure>>;
}

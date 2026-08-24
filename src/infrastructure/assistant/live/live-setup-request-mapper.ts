import type { LiveSetupRequestDto } from '@infrastructure/assistant/live/dtos/live-setup-request-dto';
import type { RequestMapper } from '@core/mapper/request-mapper';

/**
 * Builds the frame that opens a live session — which is a trigger, not a
 * configuration.
 *
 * @remarks
 * - **The server ignores what is in here.** Measured against the live API: with
 *   an ephemeral token, the setup baked into the token at mint time is
 *   authoritative and this frame's contents are discarded. Sending the full
 *   setup and sending `{ model }` produce byte-identical sessions, down to the
 *   prompt token count — and a client that declared tools the token did not
 *   carry got a session with NO tools and no error to say so.
 * - **It is still required.** A session that sends nothing never reaches
 *   `setupComplete`; it simply hangs until it times out. So the frame has to
 *   go, and the model id is what it carries.
 * - **This is why the system instruction, the tool list and the action enum
 *   live on the backend.** Duplicating them here would have produced a client
 *   that looks correct, compiles, passes its tests, and silently disagrees with
 *   the session it is actually talking to. The one thing the app still owns is
 *   the vocabulary it DISPATCHES (`AssistantAction`), which the registry needs
 *   whether or not the model was offered the same words.
 * - **The resumption handle goes to the mint, not here.** Same reason: a handle
 *   in this frame is discarded, so continuing a session means asking the
 *   backend for a token minted with it.
 */
// Only this file names it, so rule 1 keeps it unexported and next to its use.
interface LiveSetupInput {
  model: string;
}

export const toLiveSetupRequest: RequestMapper<LiveSetupInput, LiveSetupRequestDto> = (input) => ({
  setup: { model: input.model },
});

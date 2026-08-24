import type { Failure } from '@core/failure/failure';
import type { AssistantTextReply } from '@domain/assistant/session/assistant-text-reply';
import type { Result } from '@core/result/result';

/**
 * Port for the typed turn.
 *
 * @remarks
 * - **This is the mode that still works when voice cannot** — out of budget, in
 *   a quiet room, on a bad connection. It is not a degraded session: it runs as
 *   one request, holds no socket, and costs a fraction of a spoken turn.
 * - **It is a separate port from the session on purpose.** A screen with no
 *   voice budget must still be able to ask, and folding this into
 *   `AssistantSessionInterface` would have made the thing that works depend on
 *   the thing that does not.
 */
export interface AssistantMessengerInterface {
  ask(
    message: string,
    languageCode: string,
    screenContext?: string,
  ): Promise<Result<AssistantTextReply, Failure>>;
}

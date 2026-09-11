import type { AssistantMicrophone } from '../audio/assistant-microphone';
import type { AssistantPlayer } from '../audio/assistant-player';
import type { AssistantSession } from '../session/session';
import type { ToolRegistry } from '../tools/tool-registry';

/**
 * What a controller is built from.
 *
 * @remarks
 * - **`getConnection` is the only thing an app must write.** It asks the app's
 *   own server for a short-lived credential (a Gemini ephemeral token, say)
 *   and returns it; throw to refuse, and the thrown value comes back as the
 *   failure's `cause`. It is called again with a `resumptionHandle` when the
 *   provider hands a long conversation over to a new socket.
 * - **Timings have measured defaults** (see the controller); pass only what
 *   your product needs different. `silenceTimeoutMs: null` never ends a
 *   session for silence — mind that an open microphone is usually billed.
 */
export interface AssistantControllerOptions<Connection> {
  readonly session: AssistantSession<Connection>;
  readonly microphone: AssistantMicrophone;
  readonly player: AssistantPlayer;
  readonly getConnection: (request: { readonly resumptionHandle?: string }) => Promise<Connection>;
  readonly tools?: ToolRegistry;
  readonly timing?: {
    /** A pause this long ends an utterance; after the user's, the turn is the model's. Default 1200. */
    readonly utteranceGapMs?: number;
    /** How long after the user's utterance a reply may take before `no_answer`. Default 12000. */
    readonly answerTimeoutMs?: number;
    /** End the session after this long with nothing heard or said; null never does. Default 90000. */
    readonly silenceTimeoutMs?: number | null;
    /** Where the microphone cannot cancel echo, how long it stays shut after the assistant's audio ends. Default 250. */
    readonly echoTailMs?: number;
    /** Handovers in a row with no completed turn before the session is given up. Default 3. */
    readonly maxHandovers?: number;
  };
  /** Milliseconds, only moving forwards. Defaults to `performance.now()`. */
  readonly clock?: () => number;
}

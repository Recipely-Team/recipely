import type { OsIntentInvocation } from '@domain/assistant/os/os-intent-invocation';
import type { OsRecipeHandle } from '@domain/assistant/os/os-recipe-handle';

/**
 * Port for the operating system's own assistant surfaces.
 *
 * @remarks
 * - **Reading the queue does not empty it.** `pendingInvocations` leaves every
 *   entry in place and the caller `acknowledge`s each one once it has actually
 *   been dispatched. A read that consumed the queue would lose the request
 *   whenever the app was killed in between — which, for an app Siri launched
 *   and the user then swiped away, is the ordinary case rather than the edge.
 * - **`subscribe` is only for an app that is already running.** The cold-launch
 *   path is the queue: by the time a listener could be attached, the intent has
 *   long since run.
 * - **This port performs nothing.** It carries requests up to
 *   `AssistantActionRegistry`, which is the one thing that knows how to run a
 *   word. A second dispatcher here would be a second implementation of the
 *   vocabulary, in a layer with no access to the screens the handlers drive.
 * - **`isAvailable` is false on web and on any build without the native module**,
 *   so callers ask once rather than testing the platform at each call site.
 */
export interface OsAssistantInterface {
  readonly isAvailable: boolean;

  /** Requests made while the app was not running, oldest first. */
  pendingInvocations(): Promise<OsIntentInvocation[]>;

  /** Drops one request from the queue, after it has been dispatched. */
  acknowledge(invocationId: string): Promise<void>;

  /** Registers a listener and returns the function that removes it. */
  subscribe(listener: (invocation: OsIntentInvocation) => void): () => void;

  /** Replaces the catalogue the OS resolves recipe names against. */
  publishRecipes(recipes: readonly OsRecipeHandle[]): Promise<void>;

  /**
   * Hands the native side what it needs to answer without opening the app.
   *
   * A `null` token withdraws the ability: after a sign-out there is nothing
   * left for a headless intent to ask on the user's behalf.
   */
  publishCredentials(token: string | null, languageCode: string): Promise<void>;
}

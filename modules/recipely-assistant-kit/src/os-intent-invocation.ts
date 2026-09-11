/**
 * One request the OS assistant made of the app, queued until the app can serve it.
 *
 * @remarks
 * - **Nothing here names an `AssistantAction`.** The module is a transport: it
 *   carries a word and an argument across the native boundary and has no
 *   opinion about which words exist. The vocabulary belongs to
 *   `@domain/assistant`, which is above this layer and stays the only place
 *   that defines it — so `action` is a bare `string` on purpose, narrowed by
 *   `isAssistantAction` once it reaches the app.
 * - **`at` exists so a stale request can be dropped.** An invocation queued
 *   while the app was closed may be answered minutes later, and "search for
 *   soup" arriving after the user has already opened something else is worse
 *   than nothing happening.
 */
export interface OsIntentInvocation {
  /** The catalogue entry's id — `searchRecipes`, `askRecipely`, … */
  readonly id: string;
  /** The queue entry's own identity, for `removePendingInvocationAsync`. */
  readonly invocationId: string;
  /** The assistant action word to dispatch, when the entry maps to one. */
  readonly action: string | null;
  /** The single string argument the registry's handlers take. */
  readonly arg: string | null;
  /** Milliseconds since the epoch. */
  readonly at: number;
}

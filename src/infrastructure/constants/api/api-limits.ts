/**
 * Sizes the backend enforces on what the app sends.
 *
 * @remarks
 * A limit lives on both sides of the wire and neither repository can see the
 * other's, so the number is written here deliberately rather than discovered by
 * a 400. The screen line is the case that proved it: the validator capped it at
 * 200 characters, the feed's own line measures around 365, and typing to the
 * assistant from the app's home screen was refused before the model ever saw
 * it — reported to the user as a request that did not arrive.
 */
export const ApiLimits = {
  /**
   * The assistant's one-line screen state.
   *
   * Clamped rather than trusted: the line names recipes, and recipe names are
   * written by users, so nothing about its length is under this app's control.
   * Matches `SCREEN_CONTEXT_MAX` in the backend's assistant validator.
   */
  assistantScreenContext: 800,
} as const;

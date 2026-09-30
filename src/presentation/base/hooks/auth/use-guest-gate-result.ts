export interface UseGuestGateResult {
  /** Whether the "sign in to continue" prompt is currently open. */
  promptVisible: boolean;
  /** The per-action message passed to the last `requestGate` call that opened the prompt, if any. */
  promptMessage: string | undefined;
  /**
   * Runs `action` immediately when signed in; otherwise opens the prompt
   * instead of running it. `message` is optional per-action copy (e.g. "Sign
   * in to like this recipe.") surfaced to the caller as `promptMessage` — the
   * prompt UI falls back to a generic message when it's omitted.
   */
  requestGate: (action: () => void, message?: string) => void;
  /** Dismisses the prompt without running the gated action. */
  closePrompt: () => void;
}

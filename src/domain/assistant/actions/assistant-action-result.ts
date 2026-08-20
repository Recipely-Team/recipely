/**
 * What a handler tells the model, and what the session sends back as the tool
 * response.
 *
 * @remarks
 * - **Deliberately tiny.** This is the single biggest lever on the token cost:
 *   a recipe object here would put ~800 tokens of recipe text into the voice
 *   context and carry it in the history of every later turn. The model does not
 *   need the recipe — it commanded that one be written, and a title plus two
 *   counts is enough to say what happened out loud.
 * - **`ctx` is why there is no separate context turn.** Sending the screen state
 *   as its own `realtimeInput.text` would start a new model turn and be paid for
 *   as one; riding along inside a tool response the model was already waiting
 *   for costs about fifteen tokens and nothing else.
 * - **`awaiting` is an answer, not a stall.** A destructive action opens a
 *   confirm sheet and answers immediately, because a live session that gets no
 *   tool response simply stops — the assistant would go silent while the user
 *   looked at a dialog.
 */
export interface AssistantActionResultType {
  readonly ok: boolean;
  /** Present when the action produced something nameable, e.g. a recipe. */
  readonly title?: string;
  /** Counts, never contents: `{ ing: 8, step: 6 }`. */
  readonly n?: Readonly<Record<string, number>>;
  /** One line of screen state, e.g. `screen=createRecipe draft=8/6`. */
  readonly ctx?: string;
  /** Set when the user still has to confirm before anything happens. */
  readonly awaiting?: boolean;
  /** A short machine-readable reason when `ok` is false. */
  readonly error?: string;
}

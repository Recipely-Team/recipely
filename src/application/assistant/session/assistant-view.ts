/**
 * How much of the assistant is on screen, as one word.
 *
 * @remarks
 * - **Three states, not two booleans.** This replaced an `isPanelOpen` flag,
 *   which could only say "panel" or "no panel" — the mini bar the user leaves
 *   running while they cook was a third thing, and expressing it as a second
 *   boolean would have permitted a mini bar that is also fully open.
 * - **Closed is not idle.** A session can be live with nothing showing; what
 *   the assistant is DOING is `AssistantStatus`, and the two are read together
 *   by the pill.
 */
export const AssistantView = {
  /** Nothing but the pill. */
  Closed: 'closed',
  /** A slim bar: level, mute, hang up — the screen underneath stays usable. */
  Mini: 'mini',
  /** The full panel, with the transcript and the text field. */
  Open: 'open',
} as const;

export type AssistantViewType = (typeof AssistantView)[keyof typeof AssistantView];

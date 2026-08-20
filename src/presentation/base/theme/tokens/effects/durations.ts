/**
 * Animation lengths, in milliseconds.
 *
 * @remarks
 * Named here rather than typed at the call site for the same reason spacing is:
 * a fade that reads well is a design decision, and one written as `200` in four
 * components drifts to four different fades. These are the perceptual bands —
 * `imageFade` hides an image decode without reading as a delay; longer starts
 * to feel like the app is slow, shorter shows the swap.
 */
export const durations = {
  /**
   * Pointer-hover lift on a card. Short enough that the card is already up by
   * the time the eye arrives, long enough not to read as a jump.
   */
  hover: 160,
  /** Cross-fade when a cached or freshly decoded image appears. */
  imageFade: 180,
  /** Collapse / reveal of the scrolling header band. */
  headerCollapse: 220,
  /**
   * One breath of a waiting pulse. Long enough to read as "alive, not stuck"
   * without pulling the eye back every second of a two-minute wait.
   */
  pulse: 1100,
  /** One sweep of a skeleton shimmer across a placeholder row. */
  shimmer: 1200,
} as const;

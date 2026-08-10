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
  /** Cross-fade when a cached or freshly decoded image appears. */
  imageFade: 180,
  /**
   * One breath of a waiting pulse. Long enough to read as "alive, not stuck"
   * without pulling the eye back every second of a two-minute wait.
   */
  pulse: 1100,
} as const;

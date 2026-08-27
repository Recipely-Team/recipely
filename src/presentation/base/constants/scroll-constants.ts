/**
 * How often a scrolling surface reports its position.
 *
 * @remarks
 * These are not one value spelled twice. A header that translates with the
 * scroll has to be told about every frame or it visibly lags the finger; a
 * hook that only needs to know roughly where the list is — so a later "scroll
 * down" can step from it — costs a bridge crossing each time it asks and wants
 * far fewer. Both were written as bare numbers, `16` in three screens and
 * `100` in one module, which is exactly how two different decisions come to
 * look like one typo.
 */
export const scrollThrottleMs = {
  /** Every frame at 60fps. For anything animating in step with the scroll. */
  perFrame: 16 as number,
  /** Ten times a second. For tracking a position that is only read on demand. */
  coarse: 100 as number,
} as const;

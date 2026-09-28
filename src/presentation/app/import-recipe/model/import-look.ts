/**
 * The importing screen's colours for one platform: the provenance cue the ring,
 * its glow, the status pill and the active stage all wear.
 */
export interface ImportLook {
  /** The bloom, the rim and the dish, corner to corner. */
  gradient: readonly [string, string, ...string[]];
  /** Where each `gradient` colour sits along the progress ring, 0..1. */
  ringStops: readonly number[];
  /** The active stage's marker. */
  accent: string;
  /** The status pill's fill; a flat colour is given twice. */
  pill: readonly [string, string, ...string[]];
  pillText: string;
}

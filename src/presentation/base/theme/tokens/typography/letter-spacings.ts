/**
 * Tracking steps, ascending. Large type needs negative tracking to stop
 * looking loose; small uppercase labels need positive tracking to stay
 * readable. Everything in between uses `normal`.
 */
export const letterSpacings = {
  /** Web display type at its largest — the only place tracking goes past -0.8. */
  ultraTight: -1,
  /** Hero type. */
  tightest: -0.8,
  /** Headlines. */
  tighter: -0.5,
  /** Titles and section headings. */
  tight: -0.3,
  /** Body copy — the default. */
  normal: 0,
  /** Small caps-ish eyebrow text that is not fully uppercase. */
  subtle: 0.2,
  /** Uppercase micro-labels and overlines. */
  wide: 0.5,
  /** The smallest uppercase type, where the letters would otherwise collide. */
  wider: 0.8,
} as const;

/**
 * Offsets for slicing a `#RRGGBB` body into its channel pairs.
 *
 * The ranges are tuples so they spread straight into `String.prototype.slice`:
 * `expanded.slice(...HexColorConstants.redRange)`.
 *
 * Sits next to `contrast.ts`, its only consumer, rather than in the shared
 * constants barrel: these are the parsing details of one function, not a
 * cross-cutting vocabulary the rest of the app reads.
 */
export const HexColorConstants = {
  /** `#RGB` shorthand body length, before each digit is doubled. */
  shorthandLength: 3 as number,
  /** `#RRGGBB` body length. */
  fullLength: 6 as number,
  /** Base for `parseInt` on a hex pair. */
  radix: 16 as number,
  redRange: [0, 2] as [number, number],
  greenRange: [2, 4] as [number, number],
  blueRange: [4, 6] as [number, number],
} as const;

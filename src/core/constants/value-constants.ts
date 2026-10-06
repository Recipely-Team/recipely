/**
 * Numeric literals that carry a name rather than a measurement.
 *
 * Only values whose meaning is structural (an empty count, the first index,
 * a single step) belong here. Design measurements — spacing, radii, font and
 * icon sizes — stay in `@presentation/base/theme/spacing`, and API limits stay
 * in `@infrastructure/constants/api`; do NOT add arbitrary numbers such as 20.
 */
// Values are widened to `number` on purpose: these name a quantity, they do not
// constrain one. Literal types here would infect every `useState(zero)` with
// `useState<0>` and force an explicit generic at each call site.
export const ValueConstants = {
  zero: 0 as number,
  one: 1 as number,
  two: 2 as number,
  three: 3 as number,
  /** A fraction (0–1) times this is a percentage. */
  percent: 100 as number,
  minusOne: -1 as number,
} as const;

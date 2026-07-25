/**
 * Named alpha levels, so no component ever writes a bare `0.5`.
 *
 * NAMING — the rule that makes this list readable instead of a pile of
 * adjectives. A token is `<role>` for the family's default, plus a suffix from
 * the ordered set `Faint < Subtle < Light < (default) < Strong`. The suffix
 * grades **how much the token does**, never the number itself: within a family
 * `Faint` always has the weakest visible effect and `Strong` the most, whether
 * that means a lower alpha (dimming) or a higher one (a scrim). Families are
 * listed in the order a reader meets them, and every family is monotonic — if
 * a new value breaks the ordering, the family is wrong, not the value.
 *
 * This replaced an ad-hoc set (`pressedGentle`, `scrimLight`, `nearOpaque`)
 * where `disabledStrong` (0.6) dimmed LESS than `disabled` (0.5) while
 * `pressedStrong` (0.7) dimmed MORE than `pressed` (0.75) — the suffix meant
 * opposite things in neighbouring families.
 *
 * Values carry `as number` on purpose so call sites feeding them into animated
 * or interpolated styles are not narrowed to a literal type (see the widening
 * note in `@core/constants/value-constants.ts`).
 */
export const opacities = {
  /** Fully opaque — the resting state of every enabled control. */
  full: 1 as number,

  // ── Press feedback ────────────────────────────────────────────────────────
  /** Press on a large photographic surface, where dimming reads instantly. */
  pressedFaint: 0.88 as number,
  /** Press on a card or tile. */
  pressedSubtle: 0.85 as number,
  /** Press on a tinted / gradient surface. */
  pressedLight: 0.8 as number,
  /** The default press feedback for a tappable surface. */
  pressed: 0.75 as number,
  /** Press on a small, high-contrast control that needs an obvious dip. */
  pressedStrong: 0.7 as number,

  // ── Unavailable content ───────────────────────────────────────────────────
  /** An action in flight (saving, submitting) — still legible, clearly busy. */
  disabledFaint: 0.6 as number,
  /** The default disabled control. */
  disabled: 0.5 as number,
  /** A disabled control that must recede further, e.g. behind an overlay. */
  disabledStrong: 0.45 as number,
  /** Not disabled but not yet reached — an unvisited step, an inactive dot. */
  inactive: 0.4 as number,

  // ── Foreground over imagery ───────────────────────────────────────────────
  /** Body text laid over a photo or gradient. */
  onMediaFaint: 0.92 as number,
  /** Secondary text over a photo or gradient. */
  onMediaSubtle: 0.9 as number,
  /** Hero subtitle / muted caption over a photo or gradient. */
  onMedia: 0.82 as number,

  // ── Decorative scrims ─────────────────────────────────────────────────────
  /** The faintest overlay tint. */
  scrimFaint: 0.12 as number,
  /** A light overlay tint. */
  scrimSubtle: 0.16 as number,
  /** The default overlay tint. */
  scrim: 0.18 as number,
} as const;

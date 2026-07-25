/**
 * Caps for `maxFontSizeMultiplier` on text that lives inside a shape which
 * genuinely cannot grow — a numbered circle, a count badge.
 *
 * Everywhere else text is left uncapped and the box is given a `minHeight`
 * instead, because capping is a last resort: it stops honouring the user's
 * accessibility setting. Only use a cap where growing the box would break the
 * shape itself (a circle stops being a circle), never to protect a layout that
 * could have been made flexible.
 */
export const maxFontScales = {
  /** Digits inside a fixed-diameter circle or count badge. */
  badge: 1.3,
} as const;

/**
 * Line-box MULTIPLIERS, never absolute point values.
 *
 * A fixed `lineHeight: 22` is the single most common responsiveness bug in a
 * React Native app: `fontSize` is multiplied by the OS accessibility font
 * scale at render time but `lineHeight` is not, so at large accessibility
 * sizes the glyphs outgrow their line box and clip or overlap. Deriving the
 * line box from the font size — via `useTextLineHeight` for live text, or
 * `lineHeightFor` for a static `StyleSheet` entry — keeps the ratio intact at
 * every font scale.
 */
export const lineHeights = {
  /** Display copy set solid — a hero headline that must not look airy. */
  solid: 1.05,
  /** Display copy — headlines and numerals that should sit tight. */
  tight: 1.15,
  /** Headings and short single-line labels. */
  snug: 1.3,
  /** Default for body copy and captions. */
  normal: 1.45,
  /** Long-form paragraphs (recipe steps, descriptions, comments). */
  relaxed: 1.6,
} as const;

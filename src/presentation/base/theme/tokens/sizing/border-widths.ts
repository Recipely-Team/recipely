/**
 * Stroke weights, and the height of a hairline divider.
 *
 * Never device-scaled: a hairline is meant to be the thinnest line the display
 * can draw, and multiplying it by 1.12 turns a crisp rule into a blurry one on
 * every device that is not exactly the design baseline.
 */
export const borderWidths = {
  /** The default divider, card outline and 1pt rule. */
  hairline: 1,
  /** Emphasised form-field outline. */
  thin: 1.5,
  /** Selected tile, active tab underline, badge ring. */
  medium: 2,
  /** Selection ring, spinner track. */
  thick: 3,
} as const;

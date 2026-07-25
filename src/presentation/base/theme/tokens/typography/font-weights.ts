/**
 * The weight ladder, ascending. Named so a component states its intent
 * (`fontWeights.semibold`) instead of a numeric string whose meaning depends on
 * the reader knowing the CSS scale.
 *
 * Values keep their literal types on purpose — unlike the numeric tokens, these
 * are NOT widened. React Native's `TextStyle['fontWeight']` is itself a union of
 * these exact string literals, so widening to `string` would make every call
 * site fail to type-check.
 *
 * The app deliberately uses five of the nine CSS steps; reuse the closest
 * rather than introducing `'300'` or `'900'` for a one-off.
 */
export const fontWeights = {
  /** Body copy and long-form text. */
  regular: '400',
  /** Slightly emphasised body copy. */
  medium: '500',
  /** Labels, buttons, captions that need to stand out from body text. */
  semibold: '600',
  /** Titles, section headings, numerals in badges. */
  bold: '700',
  /** Display and hero type. */
  heavy: '800',
} as const;

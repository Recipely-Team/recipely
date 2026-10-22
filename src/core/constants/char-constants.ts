/**
 * Single-character and separator string literals used across the codebase.
 *
 * Exists so string building/splitting never hard-codes a bare literal —
 * `CharConstants.empty` states the intent that `''` alone does not.
 */
// Widened to `string` on purpose — see the note in `value-constants.ts`.
// `CharConstants.empty` must behave exactly like `''` did at call sites, and a
// literal `''` type would break `useState(empty)` / `onChangeText` inference.
export const CharConstants = {
  empty: '' as string,
  space: ' ' as string,
  comma: ',' as string,
  commaSpace: ', ' as string,
  dot: '.' as string,
  slash: '/' as string,
  colon: ':' as string,
  dash: '-' as string,
  /** Separates a label from its detail inline — never a bullet list marker. */
  middotSpaced: ' · ' as string,
  /** Display placeholder for a value the backend never sent — NOT a zero. */
  emDash: '—' as string,
  newline: '\n' as string,
  /** A blank line between paragraphs of plain text (an email body). */
  paragraphBreak: '\n\n' as string,
  percent: '%' as string,
  /** Starts a query string; also the placeholder initial of a nameless avatar. */
  questionMark: '?' as string,
  /** Social handles (`@cook`) and the local/domain split of an email. */
  at: '@' as string,
  /** URL fragments and the group marker of an ingredient line. */
  hash: '#' as string,
  plus: '+' as string,
  /** The typographic minus (U+2212) a signed change is shown with; `dash` is the hyphen. */
  minus: '\u2212' as string,
  equals: '=' as string,
  ampersand: '&' as string,
  openBracket: '[' as string,
  colonSpace: ': ' as string,
  semicolonSpace: '; ' as string,
  /** One character, not three dots: the glyph a truncated label ends with. */
  ellipsis: '…' as string,
  /** The pad character of fixed-width numbers (`07`, hex bytes). */
  zeroDigit: '0' as string,
} as const;

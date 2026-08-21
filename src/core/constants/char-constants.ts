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
} as const;

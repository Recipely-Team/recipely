import { CharConstants, ValueConstants } from '@core/constants';

/** What a numbered list says when it has nothing in it. */
const NOTHING = 'none';

/**
 * Rows as a spoken, 1-based list.
 *
 * @remarks
 * - **Unbounded, unlike {@link recipeRoster}.** The roster stops at eight
 *   because it rides inside every tool result and nobody can see more than that
 *   at once; a reading is built only when the user asks for one, and the person
 *   asking usually cannot see any of the screen at all.
 * - **The numbers match `rowAt`**, so "the fourth one" said back after a
 *   reading resolves to the row that was read out fourth.
 */
export const numberedLines = (lines: readonly string[]): string => {
  if (lines.length === ValueConstants.zero) return NOTHING;
  return lines
    .map((line, index) => `${index + ValueConstants.one}) ${line}`)
    .join(CharConstants.space);
};

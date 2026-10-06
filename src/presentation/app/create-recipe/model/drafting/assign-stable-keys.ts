import { ValueConstants } from '@core/constants';

/**
 * Carries each row's key from the previous list to the next one, so an
 * editable list keyed by these never re-keys a row because a sibling moved.
 *
 * @remarks
 * - **Same length** — an edit (at most one value changed) keeps every key in
 *   place; otherwise rows are matched by value (a move), and any row left
 *   unmatched keeps its positional key.
 * - **Length changed** (add / remove) — rows are matched by value, in order;
 *   an unmatched new row gets a fresh key from `newKey`.
 * - Duplicate values (e.g. two empty rows) match in order, which is the best
 *   any value-only diff can do and never mixes up rows with different text.
 */
export function assignStableKeys(
  prevValues: readonly string[],
  prevKeys: readonly string[],
  nextValues: readonly string[],
  newKey: () => string,
): string[] {
  if (prevValues.length === nextValues.length) {
    const changed = nextValues.filter((value, i) => value !== prevValues[i]).length;
    if (changed <= ValueConstants.one) return [...prevKeys];
  }
  const used = new Set<number>();
  return nextValues.map((value, i) => {
    const match = prevValues.findIndex((prev, j) => !used.has(j) && prev === value);
    if (match !== ValueConstants.minusOne) {
      used.add(match);
      return prevKeys[match] ?? newKey();
    }
    const samePosition = prevValues.length === nextValues.length && !used.has(i) ? prevKeys[i] : undefined;
    if (samePosition !== undefined) {
      used.add(i);
      return samePosition;
    }
    return newKey();
  });
}

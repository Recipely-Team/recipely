import { foldForMatch } from '@presentation/base/hooks/assistant/args/fold-for-match';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Finds the row the user meant, by what they called it or by where it sits.
 *
 * @remarks
 * - **Both, because both are natural.** "Remove the yoghurt" and "remove the
 *   second one" are one request phrased two ways, and which one arrives depends
 *   entirely on whether the speaker could see the list. Supporting only names
 *   loses every unnamed row; only positions makes the user count.
 * - **A position must be the WHOLE argument.** `parseInt('2 eggs')` is `2`, so
 *   matching on a leading number alone would read "2 eggs" as "row two" and
 *   quietly act on the wrong line. The parsed value is compared back against
 *   the trimmed input, which only holds when the argument was nothing else.
 * - **Names match on a substring**, because a person says "the yoghurt" for a
 *   row that reads "200 g full-fat yoghurt". The first match wins: a list with
 *   two yoghurts is one the speaker would disambiguate themselves.
 * - **`null`, never a guess.** Every caller turns this into a `not_found` the
 *   model can say out loud; acting on the closest row would be the one failure
 *   a user cannot see coming.
 */
export function rowAt(rows: readonly string[], arg: string | undefined): number | null {
  if (arg === undefined || arg === CharConstants.empty) return null;

  const trimmed = arg.trim();
  const position = Number.parseInt(trimmed, 10);
  if (Number.isFinite(position) && String(position) === trimmed) {
    const index = position - ValueConstants.one;
    return index >= ValueConstants.zero && index < rows.length ? index : null;
  }

  // Folded, not locale-lowercased: `toLocaleLowerCase` is the mirror of the
  // taxonomy bug — on a Turkish device it turns "Italian" into "ıtalian", and
  // it leaves "İ" as an i plus a combining dot that no spoken word carries.
  const needle = foldForMatch(trimmed);
  const found = rows.findIndex((row) => foldForMatch(row).includes(needle));
  return found === ValueConstants.minusOne ? null : found;
}

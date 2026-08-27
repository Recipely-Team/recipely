/**
 * Folds a string so a spoken or typed name matches the text on screen.
 *
 * @remarks
 * - **Turkish is why this exists, and it broke both directions.** `İ` is not
 *   `I` with a lowercase of `i`: `'İtalyan'.toLowerCase()` is `i` followed by a
 *   COMBINING DOT ABOVE (U+0307), eight code points where the spoken
 *   `'italyan'` is seven — so every cuisine whose name starts with `İ` was
 *   unmatchable and the assistant answered `unknown_cuisine` for a row it was
 *   looking straight at. `toLocaleLowerCase` fails the mirror case: on a
 *   Turkish device `'Italian'` folds to `'ıtalian'` with a dotless ı.
 * - **Marks are stripped, not mapped.** Decomposing and dropping the combining
 *   range covers ü, ö, ç, ğ, ş and İ in one rule instead of a table someone has
 *   to remember to extend. Only ı needs naming: it is a distinct letter, not an
 *   i carrying a mark, so decomposition leaves it alone.
 * - **For HUMAN text only.** Machine constants — taxonomy keys, difficulty
 *   enums — stay on `machineLower`: they are ASCII by construction and folding
 *   would let two different keys collide.
 */
export const foldForMatch = (value: string): string =>
  value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().replace(DOTLESS_I, 'i').trim();

/**
 * Local rather than in `RegexConstants`: only this file matches on folded text,
 * and a shared `g`-flagged regex carries `lastIndex` between call sites.
 */
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const DOTLESS_I = /\u0131/g;

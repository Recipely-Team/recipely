import type { ParsedIngredient } from '@presentation/app/recipes/[recipeId]/model/ingredients/parsed-ingredient';
import { CharConstants, ValueConstants } from '@core/constants';

const FRACTION_RE = /[¼½¾⅓⅔⅛⅜⅝⅞]/;
/** A leading number, decimal, simple fraction or vulgar fraction, plus a range. */
const AMOUNT = String.raw`(?:\d+(?:[.,]\d+)?(?:\/\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*-\s*\d+(?:[.,]\d+)?)?`;
const UNIT_LETTERS = 'a-zA-ZçğıöşüÇĞİÖŞÜ';

/**
 * An amount followed by a unit.
 *
 * The `(?![letters])` after the unit is load-bearing. `{1,6}` is greedy and had
 * nothing stopping it mid-word, so "3 yumurta" was read as the amount
 * "3 yumurt" and the ingredient "a" — badge and name each holding part of the
 * same word. The lookahead makes the unit match only where a word actually
 * ends, and because the group is optional a longer word just leaves it
 * unmatched.
 */
const QTY_WITH_UNIT_RE = new RegExp(
  String.raw`^\s*${AMOUNT}(?:\s*[${UNIT_LETTERS}]{1,6}\.?(?![${UNIT_LETTERS}]))?`,
);

/** The amount alone — the fallback for when the "unit" was the ingredient. */
const QTY_ONLY_RE = new RegExp(String.raw`^\s*${AMOUNT}`);

/**
 * Splits a raw ingredient line into a leading quantity chunk and its name.
 *
 * Falls back to the amount alone when the unit pattern consumed the entire
 * line: a short ingredient ("½ limon", "3 elma") looks exactly like a unit to
 * it, and bailing out left those rows with no amount badge at all while
 * longer-named ones kept theirs.
 */
export const parseIngredient = (raw: string): ParsedIngredient => {
  const trimmed = raw.trim();
  if (trimmed.length === ValueConstants.zero) return { qty: CharConstants.empty, name: CharConstants.empty };

  const withUnit = trimmed.match(QTY_WITH_UNIT_RE);
  if (!withUnit) return { qty: CharConstants.empty, name: trimmed };

  const match = trimmed.slice(withUnit[ValueConstants.zero].length).trim().length > ValueConstants.zero
    ? withUnit
    : trimmed.match(QTY_ONLY_RE);
  if (!match) return { qty: CharConstants.empty, name: trimmed };

  const qtyChunk = match[ValueConstants.zero].trim();
  const rest = trimmed.slice(match[ValueConstants.zero].length).trim();
  // Nothing but an amount: splitting would leave the row with no name at all.
  if (rest.length === ValueConstants.zero) return { qty: CharConstants.empty, name: trimmed };

  if (!/\d/.test(qtyChunk) && !FRACTION_RE.test(qtyChunk)) {
    return { qty: CharConstants.empty, name: trimmed };
  }

  return { qty: qtyChunk, name: rest };
};

import type { ParsedIngredient } from '@presentation/app/recipes/[recipeId]/model/ingredients/parsed-ingredient';
import { CharConstants, ValueConstants } from '@core/constants';

const FRACTION_RE = /[¼½¾⅓⅔⅛⅜⅝⅞]/;
const QTY_HEAD_RE = /^\s*(\d+(?:[.,]\d+)?(?:\/\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*-\s*\d+(?:[.,]\d+)?)?(?:\s*(?:[a-zA-ZçğıöşüÇĞİÖŞÜ]{1,6}\.?))?/;

/** Splits a raw ingredient line into a leading quantity chunk and its name. */
export const parseIngredient = (raw: string): ParsedIngredient => {
  const trimmed = raw.trim();
  if (trimmed.length === ValueConstants.zero) return { qty: CharConstants.empty, name: CharConstants.empty };

  const match = trimmed.match(QTY_HEAD_RE);
  if (!match) return { qty: CharConstants.empty, name: trimmed };

  const qtyChunk = match[ValueConstants.zero].trim();
  const rest = trimmed.slice(match[ValueConstants.zero].length).trim();
  if (rest.length === ValueConstants.zero) return { qty: CharConstants.empty, name: trimmed };

  if (!/\d/.test(qtyChunk) && !FRACTION_RE.test(qtyChunk)) {
    return { qty: CharConstants.empty, name: trimmed };
  }

  return { qty: qtyChunk, name: rest };
};

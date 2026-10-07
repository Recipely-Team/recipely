import { CharConstants, ValueConstants } from '@core/constants';
import { matchUnit } from '@domain/recipes/ingredients/quantity/match-unit';
import { parseAmount } from '@domain/recipes/ingredients/quantity/parse-amount';
import { Quantity } from '@domain/recipes/ingredients/quantity/quantity';
import type { IngredientTextParts } from '@domain/recipes/ingredients/ingredient-text-parts';

const DECIMAL = /\d([.,])\d/;

/**
 * Splits a trimmed ingredient line into a leading quantity and its name, or
 * `null` when it does not open with an amount.
 *
 * @remarks
 * - **Falls back to the amount alone when the unit was the whole rest.** A
 *   short ingredient ("3 adet", "1 paket") looks exactly like a unit, and
 *   bailing out left those rows with no amount badge at all while
 *   longer-named ones kept theirs.
 * - **Nothing but an amount is not split** ("3"): splitting would leave the
 *   row with no name at all.
 */
export const splitIngredientText = (trimmed: string): IngredientTextParts | null => {
  const amount = parseAmount(trimmed);
  if (amount === null) return null;

  const afterAmount = trimmed.slice(amount.length);
  const unitStart = amount.length + afterAmount.length - afterAmount.trimStart().length;
  const matched = matchUnit(trimmed.slice(unitStart));
  const unitEnd = matched === null ? amount.length : unitStart + matched.length;
  const keepsUnit = matched !== null && trimmed.slice(unitEnd).trim().length > ValueConstants.zero;
  const qtyEnd = keepsUnit ? unitEnd : amount.length;

  const name = trimmed.slice(qtyEnd).trim();
  if (name.length === ValueConstants.zero) return null;

  const quantity = Quantity.create(amount.amount, keepsUnit ? matched.unit : null, amount.upTo);
  if (!quantity.ok) return null;

  return {
    quantity: quantity.value,
    qtyText: trimmed.slice(ValueConstants.zero, qtyEnd).trim(),
    unitToken: keepsUnit ? trimmed.slice(unitStart, unitEnd) : CharConstants.empty,
    name,
    decimalMark: trimmed.slice(ValueConstants.zero, amount.length).match(DECIMAL)?.[ValueConstants.one] ?? null,
  };
};

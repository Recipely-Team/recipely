import { CharConstants, ValueConstants } from '@core/constants';
import { formatAmount } from '@domain/recipes/ingredients/quantity/format-amount';

/** "2,5 kg", "3", "su bardağı" — a line's amount as it reads; empty when it has neither amount nor unit. */
export const shoppingAmountText = (quantity: number | null, unit: string | null, decimalMark: string): string =>
  [quantity === null ? null : formatAmount(quantity, false, decimalMark), unit]
    .filter((part): part is string => part !== null && part.length > ValueConstants.zero)
    .join(CharConstants.space);

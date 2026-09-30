import { CharConstants, ValueConstants } from '@core/constants';

const DECIMAL_COMMA = /,/g;

/**
 * A typed number, or `null` when the field is empty. Accepts a decimal comma
 * (Turkish, German… keyboards type `1,5`); anything unreadable is `NaN`, which
 * the domain's validation then refuses.
 */
export const parseDecimalInput = (text: string): number | null => {
  const trimmed = text.trim();
  if (trimmed.length === ValueConstants.zero) return null;
  return Number(trimmed.replace(DECIMAL_COMMA, CharConstants.dot));
};

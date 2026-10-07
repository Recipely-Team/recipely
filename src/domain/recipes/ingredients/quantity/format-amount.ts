import { CharConstants, ValueConstants } from '@core/constants';
import { fractionValue } from '@domain/recipes/ingredients/quantity/vulgar-fractions';

/**
 * An amount as a cook reads it.
 *
 * @remarks
 * - **Kitchen measures read as fractions** (`1½`, `¾`) when the value sits
 *   within `FRACTION_TOLERANCE` of a common one; otherwise as a short decimal.
 * - **Metric reads as a decimal** whose precision shrinks as it grows: `7.5 g`,
 *   `42.5 ml`, `455 g`. More digits would claim an accuracy no scale has.
 * - **`decimalMark`** is the mark the recipe itself used, so a Turkish
 *   `1,5 kg` stays `2,25 kg` rather than switching to a dot.
 */
const COMMON_FRACTIONS = ['¼', '⅓', '½', '⅔', '¾'].map((glyph) => ({ glyph, part: fractionValue(glyph) }));

const FRACTION_TOLERANCE = 0.05;

/** Decimal places by magnitude: below `under`, keep `places`. */
const PRECISION: readonly { under: number; places: number }[] = [
  { under: 10, places: 2 },
  { under: 100, places: 1 },
];

const decimal = (value: number, decimalMark: string): string => {
  const places = PRECISION.find((step) => value < step.under)?.places ?? ValueConstants.zero;
  return String(Number(value.toFixed(places))).replace(CharConstants.dot, decimalMark);
};

const fraction = (value: number): string | null => {
  const whole = Math.floor(value);
  const rest = value - whole;
  if (rest < FRACTION_TOLERANCE) return whole > ValueConstants.zero ? String(whole) : null;
  if (rest > ValueConstants.one - FRACTION_TOLERANCE) return String(whole + ValueConstants.one);
  const glyph = COMMON_FRACTIONS.find(({ part }) => Math.abs(rest - part) < FRACTION_TOLERANCE)?.glyph;
  if (glyph === undefined) return null;
  return whole > ValueConstants.zero ? `${String(whole)}${glyph}` : glyph;
};

export const formatAmount = (value: number, asFraction: boolean, decimalMark: string): string =>
  (asFraction ? fraction(value) : null) ?? decimal(value, decimalMark);

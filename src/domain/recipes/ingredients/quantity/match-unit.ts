import { CharConstants, ValueConstants } from '@core/constants';
import { MeasureUnit, type MeasureUnitType } from '@domain/recipes/ingredients/quantity/measure-unit';
import { MEASURE_UNITS } from '@domain/recipes/ingredients/quantity/measure-unit-catalogue';

/**
 * The unit a piece of text opens with, if it names one of `MEASURE_UNITS`.
 *
 * @remarks
 * - **Longest spelling first**, so "su bardağı" wins over "bardak" and
 *   "fl oz" over "oz".
 * - **A unit ends where a word ends — load-bearing.** The old free-form
 *   pattern took up to six letters with nothing stopping it mid-word, so
 *   "3 yumurta" was read as the amount "3 yumurt" and the ingredient "a" —
 *   badge and name each holding part of the same word. Here a spelling only
 *   counts when no letter follows it ("2 lemons" is not 2 litres of "emons").
 * - **A trailing full stop belongs to the unit** ("2 yk. tereyağı").
 * - **Case is compared on the slice only**, so the length returned is always
 *   a length in the original text even when lowercasing would change it.
 */
const LETTER = /\p{L}/u;

const SPELLINGS = Object.values(MeasureUnit)
  .flatMap((unit) => MEASURE_UNITS[unit].aliases.map((alias) => ({ unit, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

export const matchUnit = (text: string): { unit: MeasureUnitType; length: number } | null => {
  for (const { unit, alias } of SPELLINGS) {
    if (text.slice(ValueConstants.zero, alias.length).toLowerCase() !== alias) continue;
    const end = text.charAt(alias.length) === CharConstants.dot ? alias.length + ValueConstants.one : alias.length;
    if (LETTER.test(text.charAt(end))) continue;
    return { unit, length: end };
  }
  return null;
};

import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';

/**
 * "P 20 g · C 76 g · F 10 g", or `null` when none of the three is known — the
 * row then drops the line rather than printing zeros it was never told
 * (design spec → Food Diary §3, "calories only").
 */
export const formatMacroLine = (nutrients: Nutrients, locale: string): string | null => {
  if (!nutrients.hasMacros) return null;
  const strings = t().diary;
  const parts: [string, number | null][] = [
    [strings.macroProteinShort, nutrients.protein],
    [strings.macroCarbsShort, nutrients.carbs],
    [strings.macroFatShort, nutrients.fat],
  ];
  return parts
    .filter((part): part is [string, number] => part[1] !== null)
    .map(([label, grams]) => strings.macroPart.replace('{l}', label).replace('{n}', formatWholeNumber(grams, locale)))
    .join(CharConstants.middotSpaced);
};

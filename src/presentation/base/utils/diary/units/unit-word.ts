import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { hasUnitWord } from '@presentation/base/utils/diary/units/has-unit-word';

/**
 * A unit key from the catalogue (`glass`, `ml`, …) as a word for `quantity`
 * of it — "glass" / "glasses", "bardak" either way. A key this build has no
 * word for reads as the key itself rather than disappearing.
 */
export const unitWord = (unitKey: string, quantity: number): string => {
  if (!hasUnitWord(unitKey)) return unitKey;
  const word = t().diary.units[unitKey];
  return quantity === ValueConstants.one ? word.one : word.other;
};

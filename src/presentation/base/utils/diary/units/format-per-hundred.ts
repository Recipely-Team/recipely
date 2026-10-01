import { ValueConstants } from '@core/constants';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import { t } from '@presentation/i18n';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { unitWord } from '@presentation/base/utils/diary/units/unit-word';

/** "38 kcal / 100 ml" — a product's energy density in its base unit. */
export const formatPerHundred = (per100: Nutrients, baseUnit: string, locale: string): string =>
  t().diary.perHundred.replace('{k}', formatWholeNumber(per100.calories, locale)).replace('{u}', unitWord(baseUnit, ValueConstants.zero));

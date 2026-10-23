import type { TranslationsType } from '@presentation/i18n';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';
import { hasUnitWord } from '@presentation/base/utils/diary/units/has-unit-word';
import { unitWord } from '@presentation/base/utils/diary/units/unit-word';

/**
 * A product amount as the diary reads it — "1,5 bardak", "250 ml", "2 glasses".
 * A serving unit this build has no word for is shown as its amount in the
 * base unit ("300 ml") when the base unit is known, else under its raw key.
 */
export const formatFoodPortion = (t: TranslationsType, unit: FoodUnit, quantity: number, baseUnit: string | null, locale: string): string => {
  const known = hasUnitWord(t, unit.key) || baseUnit === null;
  const amount = known ? quantity : quantity * unit.amount;
  const key = known ? unit.key : baseUnit;
  return t.diary.portion.replace('{n}', formatOneDecimal(amount, locale)).replace('{u}', unitWord(t, key, amount));
};

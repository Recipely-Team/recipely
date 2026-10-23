import type { TranslationsType } from '@presentation/i18n';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';

/** "350 kcal per serving", or "No calories yet" for a recipe without nutrition. */
export const formatPerServing = (t: TranslationsType, caloriesPerServing: number | null, locale: string): string =>
  caloriesPerServing === null ? t.mealPlan.noCalories : t.mealPlan.perServing.replace('{k}', formatWholeNumber(caloriesPerServing, locale));

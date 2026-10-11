import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { t } from '@presentation/i18n';

/** "350 kcal per serving", or "No calories yet" for a recipe without nutrition. */
export const formatPerServing = (caloriesPerServing: number | null, locale: string): string =>
  caloriesPerServing === null ? t().mealPlan.noCalories : t().mealPlan.perServing.replace('{k}', formatWholeNumber(caloriesPerServing, locale));

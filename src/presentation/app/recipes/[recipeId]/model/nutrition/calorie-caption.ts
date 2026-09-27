import type { NutritionReading } from '@domain/recipes/nutrition/nutrition-reading';
import { NutritionBasis } from '@domain/recipes/nutrition/nutrition-basis';
import { formatNutritionNumber } from '@presentation/app/recipes/[recipeId]/model/nutrition/format-nutrition-number';
import { t } from '@presentation/i18n';

/**
 * The line under "Calories": on 100 g it says what one serving weighs and
 * holds; per serving it multiplies out the whole recipe. `undefined` when no
 * calories were reported, since both sentences are about calories.
 */
export const calorieCaption = (reading: NutritionReading, locale: string): string | undefined => {
  const strings = t().nutrition;
  const perServing = reading.caloriesPerServing;
  if (perServing === undefined) return undefined;
  const kcal = formatNutritionNumber(perServing, locale);
  if (reading.basis === NutritionBasis.Per100g && reading.servingWeightGrams !== undefined) {
    return strings.servingIs.replace('{g}', formatNutritionNumber(reading.servingWeightGrams, locale)).replace('{k}', kcal);
  }
  return strings.total
    .replace('{s}', formatNutritionNumber(reading.servings, locale))
    .replace('{k}', kcal)
    .replace('{t}', formatNutritionNumber(reading.totalCalories ?? perServing, locale));
};

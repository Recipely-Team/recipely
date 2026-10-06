import { NutritionMacro } from '@domain/recipes/nutrition/nutrition-macro';

/**
 * Kilocalories per gram of each energy-bearing macro (the Atwater general
 * factors: 4 / 4 / 9). The one table every kcal-from-grams sum reads — a day's
 * totals and the goals sheet's "do your macros add up to your calories" check.
 */
export const AtwaterFactors = {
  [NutritionMacro.Protein]: 4,
  [NutritionMacro.Carbs]: 4,
  [NutritionMacro.Fat]: 9,
} as const;

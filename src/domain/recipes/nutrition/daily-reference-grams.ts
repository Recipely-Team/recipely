import { NutritionMacro, type NutritionMacroType } from '@domain/recipes/nutrition/nutrition-macro';

/**
 * Reference daily intake per macro, in grams, for a 2,000 kcal diet — the
 * denominator of a "% DV" figure.
 *
 * @remarks
 * - **Domain, not presentation.** The percentage is a nutritional claim the
 *   recipe makes about itself; the screen only draws it.
 */
export const DailyReferenceGrams: Readonly<Record<NutritionMacroType, number>> = {
  [NutritionMacro.Protein]: 50,
  [NutritionMacro.Carbs]: 275,
  [NutritionMacro.Fat]: 70,
  [NutritionMacro.Fiber]: 28,
};

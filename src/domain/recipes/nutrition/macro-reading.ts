import type { NutritionMacroType } from '@domain/recipes/nutrition/nutrition-macro';

/** One macro as displayed on a basis: rounded grams and its share of the daily reference. */
export interface MacroReading {
  macro: NutritionMacroType;
  grams: number;
  /** Whole percent of the daily reference, clamped to 100. */
  dailyValuePercent: number;
}

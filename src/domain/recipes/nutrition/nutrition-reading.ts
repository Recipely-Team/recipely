import type { NutritionBasisType } from '@domain/recipes/nutrition/nutrition-basis';
import type { MacroReading } from '@domain/recipes/nutrition/macro-reading';

/** A recipe's nutrition resolved against one basis, ready to be drawn. */
export interface NutritionReading {
  /** The basis actually used — `PerServing` whenever the weight is unknown. */
  basis: NutritionBasisType;
  /** Whole grams in one serving, or `undefined` when the backend has none. */
  servingWeightGrams: number | undefined;
  /** Calories on `basis`; `undefined` when none were reported. */
  calories: number | undefined;
  caloriesPerServing: number | undefined;
  servings: number;
  /** `caloriesPerServing × servings`. */
  totalCalories: number | undefined;
  /** Only the macros the backend reported, in presentation order. */
  macros: readonly MacroReading[];
}

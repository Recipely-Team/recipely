import { ValueConstants } from '@core/constants';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { NutritionBasis, type NutritionBasisType } from '@domain/recipes/nutrition/nutrition-basis';
import { NutritionMacro } from '@domain/recipes/nutrition/nutrition-macro';
import { DailyReferenceGrams } from '@domain/recipes/nutrition/daily-reference-grams';
import type { MacroReading } from '@domain/recipes/nutrition/macro-reading';
import type { NutritionReading } from '@domain/recipes/nutrition/nutrition-reading';

const GRAMS_PER_BASIS = 100;
const PERCENT_MAX = 100;
/** Below this many grams a macro keeps one decimal; at or above it, whole grams. */
const DECIMAL_BELOW = 10;
const ONE_DECIMAL = 10;

const MACRO_ORDER = [NutritionMacro.Protein, NutritionMacro.Carbs, NutritionMacro.Fat, NutritionMacro.Fiber] as const;

interface NutritionFactsProps {
  caloriesPerServing: number;
  servings: number;
  nutrition: RecipeNutrition | undefined;
}

const reported = (value: number | undefined): number | undefined =>
  value !== undefined && value > ValueConstants.zero ? value : undefined;

const roundMacro = (grams: number): number =>
  grams < DECIMAL_BELOW ? Math.round(grams * ONE_DECIMAL) / ONE_DECIMAL : Math.round(grams);

/**
 * A recipe's per-serving nutrition and the one rule for re-expressing it.
 *
 * @remarks
 * - **Zero is absence.** The API sends `0` for both "measured zero" and "never
 *   filled in", so a non-positive figure is left out rather than printed.
 * - **Per 100 g needs a weight.** Without `servingWeightGrams` every reading
 *   falls back to per serving, whatever basis was asked for.
 * - **Rounding follows the design**: calories to whole kcal; a macro under
 *   10 g keeps one decimal, anything larger is whole grams. The daily-value
 *   percent is taken from the rounded figure, so the bar and the number agree.
 * - **No `create(): Result`.** There is nothing to reject — the owning
 *   `RecipeEntity` already validated calories and servings, and every other
 *   figure is optional — so the factory is total and the entity can expose it
 *   as a plain getter.
 */
export class NutritionFacts {
  private constructor(private readonly props: NutritionFactsProps) {}

  /** Total: a non-positive figure already means "not reported", so no input is rejected. */
  static of(props: NutritionFactsProps): NutritionFacts {
    return new NutritionFacts(props);
  }

  /** Whole grams in one serving, or `undefined` when unknown. */
  get servingWeightGrams(): number | undefined {
    const weight = reported(this.props.nutrition?.servingWeightGrams);
    return weight === undefined ? undefined : Math.round(weight);
  }

  /** Whether anything at all was reported — calories or any macro. */
  get hasAny(): boolean {
    const n = this.props.nutrition;
    return [this.props.caloriesPerServing, n?.protein, n?.carbs, n?.fat, n?.fiber].some(
      (value) => reported(value) !== undefined,
    );
  }

  read(requested: NutritionBasisType): NutritionReading {
    const weight = this.servingWeightGrams;
    const basis = weight === undefined ? NutritionBasis.PerServing : requested;
    const factor = basis === NutritionBasis.Per100g && weight !== undefined ? GRAMS_PER_BASIS / weight : ValueConstants.one;
    const perServingKcal = reported(this.props.caloriesPerServing);
    const caloriesPerServing = perServingKcal === undefined ? undefined : Math.round(perServingKcal);

    const macros = MACRO_ORDER.flatMap((macro): MacroReading[] => {
      const value = reported(this.props.nutrition?.[macro]);
      if (value === undefined) return [];
      const grams = roundMacro(value * factor);
      const percent = Math.round((grams / DailyReferenceGrams[macro]) * PERCENT_MAX);
      return [{ macro, grams, dailyValuePercent: Math.min(PERCENT_MAX, percent) }];
    });

    return {
      basis,
      servingWeightGrams: weight,
      calories: perServingKcal === undefined ? undefined : Math.round(perServingKcal * factor),
      caloriesPerServing,
      servings: this.props.servings,
      totalCalories: caloriesPerServing === undefined ? undefined : caloriesPerServing * this.props.servings,
      macros,
    };
  }
}

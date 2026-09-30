/**
 * The raw figures a `Nutrients` value is built from. Calories are always
 * known; a macro is `null` when the source never reported it (a recipe with
 * calories only), which is not the same as a measured zero.
 */
export interface NutrientValues {
  readonly calories: number;
  readonly protein: number | null;
  readonly carbs: number | null;
  readonly fat: number | null;
  readonly fiber: number | null;
}

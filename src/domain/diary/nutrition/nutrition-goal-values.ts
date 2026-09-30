/** The raw daily targets a `NutritionGoals` value is built from; macros in grams. */
export interface NutritionGoalValues {
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
  readonly fiber: number;
  readonly waterGlasses: number;
}

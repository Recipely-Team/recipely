/**
 * Where a recipe's nutrition figures were looked up.
 *
 * @remarks
 * - **Mirrors the backend's `nutritionSource`.** `null` — the ordinary case —
 *   means the figures were estimated, and the panel names no source.
 * - **`Usda` is USDA FoodData Central**, which Recipely Kitchen recipes are
 *   computed from; the nutrition panel credits it in its last row.
 */
export const NutritionSource = {
  Usda: 'USDA_FDC',
} as const;

export type NutritionSourceType = (typeof NutritionSource)[keyof typeof NutritionSource];

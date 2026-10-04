/**
 * The bounds every food-diary value is held to, named once so the value
 * objects, the store and the screens cannot drift apart.
 *
 * @remarks
 * - **Mirrors `recipely-backend` `domain/diary/diary-limits.ts`.** A value the
 *   client accepts but the server refuses surfaces as a failed save, so these
 *   are never looser than the server's.
 * - **Water is glasses of 250 ml**, 0–12 a day (design spec §3).
 * - **Products count in their own unit**: 0.5 steps of a serving unit, 50 ml
 *   or 10 g of the base unit (Add food v2 spec §2b).
 */
export const DiaryLimits = {
  ServingsStep: 0.5,
  ServingsMin: 0.5,
  ServingsMax: 20,
  WaterGlassesMin: 0,
  WaterGlassesMax: 12,
  WaterGlassMilliliters: 250,
  MillilitersPerLiter: 1000,
  NameMaxLength: 120,
  /** Entry caps are plausibility, not advice: they keep a mistyped extra zero out of a month. */
  EntryCaloriesMax: 20000,
  EntryMacroMax: 2000,
  GoalCaloriesMin: 500,
  GoalCaloriesMax: 6000,
  GoalMacroMax: 600,
  GoalWaterMin: 1,
  /** The goals sheet's −/+ buttons move the calorie goal by this much. */
  GoalCaloriesStep: 50,
  /** How many foods the Add food sheet's Recent tab asks for; the backend caps it at 50. */
  RecentFoods: 20,
  /** A product entry's quantity cap, in its unit (`servings` ≤ 5000 for products on the backend). */
  ProductQuantityMax: 5000,
  /** Serving units (glass, slice, …) step in halves, like recipe servings. */
  ServingUnitStep: 0.5,
  MillilitersStep: 50,
  GramsStep: 10,
  /** Catalogue nutrients are per 100 g or ml; a product with only a base unit defaults to this much. */
  PerHundred: 100,
} as const;

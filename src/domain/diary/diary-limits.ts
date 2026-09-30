/**
 * The bounds every food-diary value is held to, named once so the value
 * objects, the store and the screens cannot drift apart.
 *
 * @remarks
 * - **Mirrors `recipely-backend` `domain/diary/diary-limits.ts`.** A value the
 *   client accepts but the server refuses surfaces as a failed save, so these
 *   are never looser than the server's.
 * - **Water is glasses of 250 ml**, 0–12 a day (design spec §3).
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
} as const;

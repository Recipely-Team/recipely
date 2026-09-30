/**
 * How a day's eaten kcal compare with the calorie goal — the tone of a date
 * cell, the ring and the status strip (design spec §2.1).
 *
 * @remarks
 * - **`none`** — nothing logged; **`under`** < 90 %; **`on`** 90–110 %;
 *   **`over`** 110–125 %; **`far`** > 125 %. Both ends of `on` are inclusive.
 * - Derived by `NutritionGoals.calorieStatus`; the thresholds live there.
 */
export const CalorieStatus = {
  None: 'none',
  Under: 'under',
  On: 'on',
  Over: 'over',
  Far: 'far',
} as const;

export type CalorieStatusType = (typeof CalorieStatus)[keyof typeof CalorieStatus];

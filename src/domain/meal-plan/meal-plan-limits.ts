/**
 * The bounds the weekly meal plan is held to — mirrors `recipely-backend`
 * `domain/meal-plan` (#392), so a value the client accepts is never one the
 * server refuses. Servings follow the diary's `Servings` (0.5 steps, 0.5–20).
 */
export const MealPlanLimits = {
  /** Planned meals one day may hold. */
  entriesPerDay: 12,
  /** Days one read, clear or ingredients request may span, inclusive. */
  rangeDaysMax: 14,
  positionMin: 0,
  positionMax: 999,
  daysPerWeek: 7,
} as const;

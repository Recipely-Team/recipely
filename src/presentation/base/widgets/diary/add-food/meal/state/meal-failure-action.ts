/**
 * What the meal-log failure face offers: send the same input again, go back
 * and change it, or nothing (the daily limit, or the feature is off — other
 * tabs still work).
 */
export const MealFailureAction = {
  Retry: 'retry',
  Edit: 'edit',
  None: 'none',
} as const;

export type MealFailureActionType = (typeof MealFailureAction)[keyof typeof MealFailureAction];

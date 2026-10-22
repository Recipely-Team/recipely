import type { MealPlanWeekIdle } from '@application/meal-plan/states/meal-plan-week-idle';
import type { MealPlanWeekLoading } from '@application/meal-plan/states/meal-plan-week-loading';
import type { MealPlanWeekLoaded } from '@application/meal-plan/states/meal-plan-week-loaded';
import type { MealPlanWeekError } from '@application/meal-plan/states/meal-plan-week-error';

/** One week of the plan as the store holds it. A loaded week stays on screen while it refreshes. */
export type MealPlanWeekState =
  | MealPlanWeekIdle
  | MealPlanWeekLoading
  | MealPlanWeekLoaded
  | MealPlanWeekError;

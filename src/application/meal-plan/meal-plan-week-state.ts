import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';

/** One week of the plan as the store holds it. A loaded week stays on screen while it refreshes. */
export type MealPlanWeekState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; week: MealPlanWeek }
  | { status: typeof StoreStatus.Error; failure: Failure };

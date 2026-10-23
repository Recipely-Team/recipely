import type { StoreStatus } from '@application/store/store-status';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';

export interface MealPlanWeekLoaded {
  status: typeof StoreStatus.Loaded;
  week: MealPlanWeek;
}

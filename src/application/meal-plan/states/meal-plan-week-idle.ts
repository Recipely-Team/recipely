import type { StoreStatus } from '@application/store/store-status';

export interface MealPlanWeekIdle {
  status: typeof StoreStatus.Idle;
}

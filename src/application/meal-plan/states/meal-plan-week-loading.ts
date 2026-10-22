import type { StoreStatus } from '@application/store/store-status';

export interface MealPlanWeekLoading {
  status: typeof StoreStatus.Loading;
}

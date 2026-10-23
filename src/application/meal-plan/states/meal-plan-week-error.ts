import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export interface MealPlanWeekError {
  status: typeof StoreStatus.Error;
  failure: Failure;
}

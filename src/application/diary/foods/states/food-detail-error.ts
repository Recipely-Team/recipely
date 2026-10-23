import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export interface FoodDetailError {
  status: typeof StoreStatus.Error;
  key: string;
  failure: Failure;
}

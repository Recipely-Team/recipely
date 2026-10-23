import type { StoreStatus } from '@application/store/store-status';

export interface FoodDetailIdle {
  status: typeof StoreStatus.Idle;
}

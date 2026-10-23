import type { StoreStatus } from '@application/store/store-status';

export interface FoodDetailLoading {
  status: typeof StoreStatus.Loading;
  key: string;
}

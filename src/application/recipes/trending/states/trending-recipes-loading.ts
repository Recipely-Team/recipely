import type { StoreStatus } from '@application/store/store-status';

export interface TrendingRecipesLoading {
  status: typeof StoreStatus.Loading;
}

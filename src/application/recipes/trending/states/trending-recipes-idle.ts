import type { StoreStatus } from '@application/store/store-status';

export interface TrendingRecipesIdle {
  status: typeof StoreStatus.Idle;
}

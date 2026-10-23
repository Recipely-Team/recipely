import type { StoreStatus } from '@application/store/store-status';

export interface ProfileStatsLoading {
  status: typeof StoreStatus.Loading;
}

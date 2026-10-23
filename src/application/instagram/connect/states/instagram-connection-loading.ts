import type { StoreStatus } from '@application/store/store-status';

export interface InstagramConnectionLoading {
  status: typeof StoreStatus.Loading;
}

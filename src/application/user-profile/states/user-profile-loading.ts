import type { StoreStatus } from '@application/store/store-status';

export interface UserProfileLoading {
  status: typeof StoreStatus.Loading;
}

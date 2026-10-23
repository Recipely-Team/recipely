import type { StoreStatus } from '@application/store/store-status';

export interface CreatorProfileLoading {
  status: typeof StoreStatus.Loading;
}

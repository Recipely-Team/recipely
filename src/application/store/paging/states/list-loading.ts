import type { StoreStatus } from '@application/store/store-status';

export interface ListLoading {
  status: typeof StoreStatus.Loading;
}

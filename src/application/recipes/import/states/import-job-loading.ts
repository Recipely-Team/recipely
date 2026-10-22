import type { StoreStatus } from '@application/store/store-status';

export interface ImportJobLoading {
  status: typeof StoreStatus.Loading;
}

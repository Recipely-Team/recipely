import type { StoreStatus } from '@application/store/store-status';

export interface AuthLoading {
  status: typeof StoreStatus.Loading;
}

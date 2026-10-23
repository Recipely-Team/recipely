import type { StoreStatus } from '@application/store/store-status';

export interface ProductStepLoading {
  status: typeof StoreStatus.Loading;
}

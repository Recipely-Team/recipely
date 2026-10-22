import type { StoreStatus } from '@application/store/store-status';

export interface Unauthenticated {
  status: typeof StoreStatus.Unauthenticated;
}

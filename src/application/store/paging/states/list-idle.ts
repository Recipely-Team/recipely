import type { StoreStatus } from '@application/store/store-status';

export interface ListIdle {
  status: typeof StoreStatus.Idle;
}

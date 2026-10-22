import type { StoreStatus } from '@application/store/store-status';

export interface AuthIdle {
  status: typeof StoreStatus.Idle;
}

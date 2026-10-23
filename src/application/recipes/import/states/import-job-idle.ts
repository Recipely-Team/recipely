import type { StoreStatus } from '@application/store/store-status';

export interface ImportJobIdle {
  status: typeof StoreStatus.Idle;
}

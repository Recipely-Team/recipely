import type { StoreStatus } from '@application/store/store-status';

export interface UserProfileIdle {
  status: typeof StoreStatus.Idle;
}

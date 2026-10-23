import type { StoreStatus } from '@application/store/store-status';

export interface InstagramConnectionIdle {
  status: typeof StoreStatus.Idle;
}

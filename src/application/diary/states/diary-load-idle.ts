import type { StoreStatus } from '@application/store/store-status';

/** Not asked for yet. */
export interface DiaryLoadIdle {
  status: typeof StoreStatus.Idle;
}

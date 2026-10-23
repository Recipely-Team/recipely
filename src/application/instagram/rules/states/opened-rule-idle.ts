import type { StoreStatus } from '@application/store/store-status';

export interface OpenedRuleIdle {
  status: typeof StoreStatus.Idle;
}

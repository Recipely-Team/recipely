import type { StoreStatus } from '@application/store/store-status';

export interface OpenedRuleLoading {
  status: typeof StoreStatus.Loading;
  id: string;
}

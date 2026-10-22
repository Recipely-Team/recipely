import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export interface OpenedRuleError {
  status: typeof StoreStatus.Error;
  id: string;
  failure: Failure;
}

import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/** The last load failed, and why. */
export interface DiaryLoadError {
  status: typeof StoreStatus.Error;
  failure: Failure;
}

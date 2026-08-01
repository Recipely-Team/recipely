import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export type DraftsListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded }
  | { status: typeof StoreStatus.Error; failure: Failure };

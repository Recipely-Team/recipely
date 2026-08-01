import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

export type DeleteRecipeState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Deleting }
  | { status: typeof StoreStatus.Success }
  | { status: typeof StoreStatus.Error; failure: Failure };

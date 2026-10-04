import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';

/** The product the product step opened; `key` is its row's, so a late answer for another row is told apart. */
export type FoodDetailState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading; key: string }
  | { status: typeof StoreStatus.Loaded; key: string; detail: FoodDetail }
  | { status: typeof StoreStatus.Error; key: string; failure: Failure };

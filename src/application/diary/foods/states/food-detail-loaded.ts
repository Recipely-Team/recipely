import type { StoreStatus } from '@application/store/store-status';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';

export interface FoodDetailLoaded {
  status: typeof StoreStatus.Loaded;
  key: string;
  detail: FoodDetail;
}

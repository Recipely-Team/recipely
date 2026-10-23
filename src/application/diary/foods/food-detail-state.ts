import type { FoodDetailIdle } from '@application/diary/foods/states/food-detail-idle';
import type { FoodDetailLoading } from '@application/diary/foods/states/food-detail-loading';
import type { FoodDetailLoaded } from '@application/diary/foods/states/food-detail-loaded';
import type { FoodDetailError } from '@application/diary/foods/states/food-detail-error';

/** The product the product step opened; `key` is its row's, so a late answer for another row is told apart. */
export type FoodDetailState =
  | FoodDetailIdle
  | FoodDetailLoading
  | FoodDetailLoaded
  | FoodDetailError;

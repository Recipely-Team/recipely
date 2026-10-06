import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';

/**
 * Something logged before, ready to log again: one serving of a recipe or a
 * quick add, or a product at the unit and quantity it was last logged in.
 */
export type RecentFoodType =
  | { readonly kind: typeof RecentFoodKind.Food; readonly key: string; readonly food: LoggableFood }
  | {
      readonly kind: typeof RecentFoodKind.Product;
      readonly key: string;
      readonly product: LoggableProduct;
      readonly quantity: FoodQuantity;
    };

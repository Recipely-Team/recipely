import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { ProductChoiceKind } from '@presentation/base/widgets/diary/add-food/state/product/product-choice-kind';

/**
 * The product the product step shows: a listed row, whose variants the
 * catalogue store fetches, or a product logged before (a recent row, an
 * entry being edited) at the unit and quantity it was logged in.
 */
export type ProductChoice =
  | { kind: typeof ProductChoiceKind.Listed; row: FoodProduct }
  | { kind: typeof ProductChoiceKind.Logged; product: LoggableProduct; quantity: FoodQuantity };

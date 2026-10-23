import type { StoreStatus } from '@application/store/store-status';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { VariantOption } from '@presentation/base/widgets/diary/add-food/state/product/variant-option';

export interface ProductStepLoaded {
  status: typeof StoreStatus.Loaded;
  product: LoggableProduct;
  /** Empty when there is only one variant — the picker is then not drawn. */
  variants: readonly VariantOption[];
  variantIndex: number;
  quantity: FoodQuantity;
}

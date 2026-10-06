import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { VariantOption } from '@presentation/base/widgets/diary/add-food/state/product/variant-option';

/** What the product step renders: its product loading, failed, or ready with the chosen variant and amount. */
export type ProductStepModelType =
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Error; failure: Failure }
  | {
      status: typeof StoreStatus.Loaded;
      product: LoggableProduct;
      /** Empty when there is only one variant — the picker is then not drawn. */
      variants: readonly VariantOption[];
      variantIndex: number;
      quantity: FoodQuantity;
    };

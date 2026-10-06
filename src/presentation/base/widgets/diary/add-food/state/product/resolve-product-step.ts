import { StoreStatus } from '@application/store/store-status';
import type { FoodDetailState } from '@application/diary/foods/food-detail-state';
import { ValueConstants } from '@core/constants';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { ProductChoiceType } from '@presentation/base/widgets/diary/add-food/state/product/product-choice';
import { ProductChoiceKind } from '@presentation/base/widgets/diary/add-food/state/product/product-choice-kind';
import type { ProductStepModelType } from '@presentation/base/widgets/diary/add-food/state/product/product-step-model';

/**
 * The product step from the flow's choice and the catalogue store's detail.
 *
 * @remarks
 * - **A detail for another row is still loading**, as far as this row is
 *   concerned — never shown under the wrong name.
 * - **Defaults come from the product**: the row's own variant, then the
 *   first serving unit at 1 (or 100 g / ml); a logged product starts where it
 *   was logged.
 * - **A chosen quantity survives a variant change** only in a unit the new
 *   variant also has; otherwise the new variant's default applies.
 */
export const resolveProductStep = (
  choice: ProductChoiceType,
  detail: FoodDetailState,
  variantIndex: number | null,
  quantity: FoodQuantity | null,
): ProductStepModelType => {
  if (choice.kind === ProductChoiceKind.Logged) {
    return { status: StoreStatus.Loaded, product: choice.product, variants: [], variantIndex: ValueConstants.zero, quantity: quantity ?? choice.quantity };
  }
  if (detail.status === StoreStatus.Idle || detail.key !== choice.row.key || detail.status === StoreStatus.Loading) {
    return { status: StoreStatus.Loading };
  }
  if (detail.status === StoreStatus.Error) return { status: StoreStatus.Error, failure: detail.failure };
  const food = detail.detail;
  const index = variantIndex ?? food.variantIndexOf(choice.row.foodVariantId);
  const product = food.productAt(index);
  const unit = quantity === null ? undefined : product.units.find((u) => u.key === quantity.unit.key);
  const variants =
    food.variants.length > ValueConstants.one
      ? food.variants.map((variant, i) => ({
          key: variant.foodVariantId ?? String(i),
          name: variant.name ?? food.name,
          per100: variant.per100,
          unitKeys: food.productAt(i).units.map((u) => u.key),
        }))
      : [];
  return {
    status: StoreStatus.Loaded,
    product,
    variants,
    variantIndex: index,
    quantity: quantity !== null && unit !== undefined ? FoodQuantity.of(unit, quantity.value) : product.defaultQuantity(),
  };
};

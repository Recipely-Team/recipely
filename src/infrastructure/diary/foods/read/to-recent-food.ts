import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { CharConstants, ValueConstants } from '@core/constants';
import { LoggableProduct } from '@domain/diary/foods/loggable-product';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';
import type { RecentFoodDto } from '@infrastructure/diary/dtos/recent-food-dto';
import { toLoggableFood } from '@infrastructure/diary/read/to-loggable-food';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';
import { toFoodLogProduct } from '@infrastructure/diary/read/to-food-log-product';

/**
 * One row of `GET /diary/foods/recent` → `RecentFood`. A product row re-logs
 * at its own unit and quantity from `perUnit`; any other row is one serving.
 */
export const toRecentFood: Mapper<RecentFoodDto, RecentFood, ValidationFailure> = (dto) => {
  if (dto.product === undefined || dto.product === null) {
    const food = toLoggableFood(dto);
    if (!food.ok) return food;
    return ok({ kind: RecentFoodKind.Food, key: [dto.recipeId ?? CharConstants.empty, dto.name].join(CharConstants.colon), food: food.value });
  }
  const ref = toFoodLogProduct(dto.product);
  if (!ref.ok) return ref;
  const perUnit = toNutrients(dto.product.perUnit);
  if (!perUnit.ok) return perUnit;
  const product = LoggableProduct.fromLogged(dto.name, ref.value, perUnit.value);
  const unit = product.units[ValueConstants.zero] ?? { key: ref.value.unitKey, amount: ref.value.unitAmount };
  return ok({
    kind: RecentFoodKind.Product,
    key: [ref.value.source, ref.value.foodVariantId ?? ref.value.offBarcode ?? dto.name, ref.value.unitKey].join(CharConstants.colon),
    product,
    quantity: FoodQuantity.of(unit, dto.servings),
  });
};

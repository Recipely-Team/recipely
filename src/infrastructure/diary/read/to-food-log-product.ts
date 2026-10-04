import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import type { FoodLogProduct } from '@domain/diary/entry/food-log-product';
import type { FoodLogProductDto } from '@infrastructure/diary/foods/dtos/food-log-product-dto';
import { toFoodSource } from '@infrastructure/diary/foods/read/vocabulary/to-food-source';

/** An entry's (or a recent food's) product reference → `FoodLogProduct`. */
export const toFoodLogProduct: Mapper<FoodLogProductDto, FoodLogProduct, ValidationFailure> = (dto) => {
  const source = toFoodSource(dto.source);
  if (!source.ok) return source;
  return ok({
    source: source.value,
    foodVariantId: dto.foodVariantId,
    offBarcode: dto.offBarcode,
    unitKey: dto.unitKey,
    unitAmount: dto.unitAmount,
  });
};

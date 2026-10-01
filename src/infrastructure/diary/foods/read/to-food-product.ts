import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodProductDto } from '@infrastructure/diary/foods/dtos/food-product-dto';
import { toFoodSource } from '@infrastructure/diary/foods/read/vocabulary/to-food-source';
import { toFoodKind } from '@infrastructure/diary/foods/read/vocabulary/to-food-kind';
import { toFoodBaseUnit } from '@infrastructure/diary/foods/read/vocabulary/to-food-base-unit';
import { toPerHundred } from '@infrastructure/diary/foods/read/to-per-hundred';
import { toFoodUnits } from '@infrastructure/diary/foods/read/to-food-units';

/** A product row → `FoodProduct`, validating its source, kind, unit and figures. */
export const toFoodProduct: Mapper<FoodProductDto, FoodProduct, ValidationFailure> = (dto) => {
  const source = toFoodSource(dto.source);
  if (!source.ok) return source;
  const kind = toFoodKind(dto.kind);
  if (!kind.ok) return kind;
  const unit = toFoodBaseUnit(dto.unit);
  if (!unit.ok) return unit;
  const per100 = toPerHundred(dto.per100);
  if (!per100.ok) return per100;
  return ok(
    FoodProduct.of({
      source: source.value,
      foodId: dto.foodId,
      foodVariantId: dto.foodVariantId,
      offBarcode: dto.offBarcode,
      kind: kind.value,
      category: dto.category,
      name: dto.name,
      variantName: dto.variantName,
      variantCount: dto.variantCount,
      brand: dto.brand,
      packSize: dto.packSize,
      unit: unit.value,
      per100: per100.value,
      servingUnits: toFoodUnits(dto.servingUnits),
      imageUrl: dto.imageUrl,
    }),
  );
};

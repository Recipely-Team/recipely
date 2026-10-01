import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { FoodDetail } from '@domain/diary/foods/product/food-detail';
import type { FoodVariant } from '@domain/diary/foods/product/food-variant';
import type { FoodDetailDto } from '@infrastructure/diary/foods/dtos/food-detail-dto';
import { toFoodSource } from '@infrastructure/diary/foods/read/vocabulary/to-food-source';
import { toFoodKind } from '@infrastructure/diary/foods/read/vocabulary/to-food-kind';
import { toFoodBaseUnit } from '@infrastructure/diary/foods/read/vocabulary/to-food-base-unit';
import { toPerHundred } from '@infrastructure/diary/foods/read/to-per-hundred';
import { toFoodUnits } from '@infrastructure/diary/foods/read/to-food-units';

/** A product's detail → `FoodDetail`. A variant with unreadable figures is dropped; none left fails the whole. */
export const toFoodDetail: Mapper<FoodDetailDto, FoodDetail, ValidationFailure> = (dto) => {
  const source = toFoodSource(dto.source);
  if (!source.ok) return source;
  const kind = toFoodKind(dto.kind);
  if (!kind.ok) return kind;
  const unit = toFoodBaseUnit(dto.unit);
  if (!unit.ok) return unit;
  const variants: FoodVariant[] = dto.variants.flatMap((variant) => {
    const per100 = toPerHundred(variant.per100);
    return per100.ok
      ? [{ foodVariantId: variant.foodVariantId, name: variant.name, per100: per100.value, servingUnits: toFoodUnits(variant.servingUnits) }]
      : [];
  });
  return FoodDetail.create({
    source: source.value,
    foodId: dto.foodId,
    offBarcode: dto.offBarcode,
    kind: kind.value,
    category: dto.category,
    name: dto.name,
    brand: dto.brand,
    packSize: dto.packSize,
    unit: unit.value,
    imageUrl: dto.imageUrl,
    variants,
  });
};

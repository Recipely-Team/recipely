import type { PerHundredDto } from '@infrastructure/diary/foods/dtos/per-hundred-dto';
import type { ServingUnitDto } from '@infrastructure/diary/foods/dtos/serving-unit-dto';

// One variant of `FoodDetail`.
export interface FoodVariantDto {
  foodVariantId: string | null;
  name: string | null;
  per100: PerHundredDto;
  servingUnits: ServingUnitDto[];
}

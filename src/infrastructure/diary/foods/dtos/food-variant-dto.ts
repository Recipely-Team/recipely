import type { KcalNutrientsDto } from '@infrastructure/diary/foods/dtos/kcal-nutrients-dto';
import type { ServingUnitDto } from '@infrastructure/diary/foods/dtos/serving-unit-dto';

// One variant of `FoodDetail`.
export interface FoodVariantDto {
  foodVariantId: string | null;
  name: string | null;
  per100: KcalNutrientsDto;
  servingUnits: ServingUnitDto[];
}

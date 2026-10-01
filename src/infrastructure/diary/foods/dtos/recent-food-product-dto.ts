import type { NutrientFieldsDto } from '@infrastructure/diary/dtos/nutrient-fields-dto';

// The product part of a recent food: what to re-log it as, and the unrounded
// nutrients of ONE of its unit.
export interface RecentFoodProductDto {
  source: string;
  foodVariantId: string | null;
  offBarcode: string | null;
  unitKey: string;
  unitAmount: number;
  foodId: string | null;
  perUnit: NutrientFieldsDto;
}

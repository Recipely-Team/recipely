import type { KcalNutrientsDto } from '@infrastructure/diary/foods/dtos/kcal-nutrients-dto';
import type { ServingUnitDto } from '@infrastructure/diary/foods/dtos/serving-unit-dto';

// A product row — a curated variant or an Open Food Facts pack — in the
// search's `products` group and in `GET /diary/foods/products`.
export interface FoodProductDto {
  source: string;
  foodId: string | null;
  foodVariantId: string | null;
  offBarcode: string | null;
  kind: string;
  category: string | null;
  name: string;
  variantName: string | null;
  variantCount: number;
  brand: string | null;
  packSize: string | null;
  unit: string;
  per100: KcalNutrientsDto;
  servingUnits: ServingUnitDto[];
  imageUrl: string | null;
}

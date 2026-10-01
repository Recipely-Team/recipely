import type { FoodVariantDto } from '@infrastructure/diary/foods/dtos/food-variant-dto';

// `GET /diary/foods/products/:foodId` and `/products/barcode/:barcode`.
export interface FoodDetailDto {
  source: string;
  foodId: string | null;
  offBarcode: string | null;
  kind: string;
  category: string | null;
  name: string;
  brand: string | null;
  packSize: string | null;
  unit: string;
  imageUrl: string | null;
  variants: FoodVariantDto[];
}

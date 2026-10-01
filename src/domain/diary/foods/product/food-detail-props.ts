import type { FoodSourceType } from '@domain/diary/foods/food-source';
import type { FoodKindType } from '@domain/diary/foods/food-kind';
import type { FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';
import type { FoodVariant } from '@domain/diary/foods/product/food-variant';

export interface FoodDetailProps {
  readonly source: FoodSourceType;
  readonly foodId: string | null;
  readonly offBarcode: string | null;
  readonly kind: FoodKindType;
  readonly category: string | null;
  readonly name: string;
  readonly brand: string | null;
  readonly packSize: string | null;
  readonly unit: FoodBaseUnitType;
  readonly imageUrl: string | null;
  /** At least one. */
  readonly variants: readonly FoodVariant[];
}

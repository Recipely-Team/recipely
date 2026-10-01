import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { FoodSourceType } from '@domain/diary/foods/food-source';
import type { FoodKindType } from '@domain/diary/foods/food-kind';
import type { FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';

export interface FoodProductProps {
  readonly source: FoodSourceType;
  /** The curated food the variant belongs to; null for an Open Food Facts pack. */
  readonly foodId: string | null;
  readonly foodVariantId: string | null;
  readonly offBarcode: string | null;
  readonly kind: FoodKindType;
  readonly category: string | null;
  /** In the reader's language (the server reads `Accept-Language`). */
  readonly name: string;
  readonly variantName: string | null;
  readonly variantCount: number;
  readonly brand: string | null;
  readonly packSize: string | null;
  readonly unit: FoodBaseUnitType;
  readonly per100: Nutrients;
  readonly servingUnits: readonly FoodUnit[];
  readonly imageUrl: string | null;
}

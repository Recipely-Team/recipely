import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';

/** One variant of a product's detail: Ayran → Klasik / Az yağlı / Az tuzlu. */
export interface FoodVariant {
  readonly foodVariantId: string | null;
  /** Null for a product with a single, unnamed variant (every branded pack). */
  readonly name: string | null;
  readonly per100: Nutrients;
  readonly servingUnits: readonly FoodUnit[];
}

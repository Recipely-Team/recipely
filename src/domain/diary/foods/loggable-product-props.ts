import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { FoodSourceType } from '@domain/diary/foods/food-source';
import type { FoodKindType } from '@domain/diary/foods/food-kind';
import type { FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';

export interface LoggableProductProps {
  /** What the diary row will read: `Ayran · Az yağlı`, `Sütaş Ayran`. */
  readonly name: string;
  readonly imageUrl: string | null;
  /** Null when only an entry is known (its kind was never logged). */
  readonly kind: FoodKindType | null;
  readonly source: FoodSourceType;
  readonly foodVariantId: string | null;
  readonly offBarcode: string | null;
  readonly brand: string | null;
  readonly packSize: string | null;
  /** Null when only an entry's own unit is known and it is a serving unit. */
  readonly baseUnit: FoodBaseUnitType | null;
  /** Nutrients of 100 of the base unit. */
  readonly per100: Nutrients;
  /** The amount picker's chips: serving units first, then the base unit. */
  readonly units: readonly FoodUnit[];
}

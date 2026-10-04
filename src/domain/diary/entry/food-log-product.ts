import type { FoodSourceType } from '@domain/diary/foods/food-source';

/**
 * The catalogue product an entry was logged from, by reference only (rule 20):
 * which variant or pack, and the unit its `servings` count. Nutrients stay the
 * entry's own snapshot.
 */
export interface FoodLogProduct {
  readonly source: FoodSourceType;
  readonly foodVariantId: string | null;
  readonly offBarcode: string | null;
  readonly unitKey: string;
  /** How much of the base unit one `unitKey` is (1 for `g` / `ml`). */
  readonly unitAmount: number;
}

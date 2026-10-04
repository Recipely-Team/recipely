import type { Page } from '@domain/common/page';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';

/** The first page of every group for one query; later pages are asked for per group. */
export interface FoodSearchResults {
  readonly query: string;
  readonly saved: Page<RecipeFoodHit>;
  readonly mine: Page<RecipeFoodHit>;
  readonly products: Page<FoodProduct>;
  readonly recipes: Page<RecipeFoodHit>;
}

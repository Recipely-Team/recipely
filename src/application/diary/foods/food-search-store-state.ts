import type { FoodSearchGroupType } from '@domain/diary/foods/search/food-search-group';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { PagedList } from '@application/diary/foods/paging/paged-list';

export interface FoodSearchStoreState {
  /**
   * The query the groups answer: `''` lists the recipe groups unfiltered (the
   * Recipes tab); null until the sheet asks for anything.
   */
  query: string | null;
  saved: PagedList<RecipeFoodHit>;
  mine: PagedList<RecipeFoodHit>;
  /** Idle while the query is empty: products are browsed by shelf, not listed whole. */
  products: PagedList<FoodProduct>;
  recipes: PagedList<RecipeFoodHit>;
  /** Searches (or, for an empty query, lists the recipe groups); the newest call wins. */
  search: (query: string) => Promise<void>;
  /** The group's next page, when it has one and none is in flight. */
  loadMore: (group: FoodSearchGroupType) => Promise<void>;
  /** Drops everything. Called when the session ends. */
  clear: () => void;
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';

/**
 * What the Add food sheet can log, from the server: the grouped search, the
 * curated catalogue, branded packs and the viewer's recent foods. Every list
 * is paged (`page` is 1-based); names come in the reader's language.
 */
export interface FoodCatalogRepositoryInterface {
  /** The first page of every group for a non-empty query. */
  search(query: string, pageSize: number): Promise<Result<FoodSearchResults, Failure>>;
  /** One recipe group's page; an empty query lists the group without filtering it. */
  searchRecipes(query: string, group: RecipeHitGroupType, page: number, pageSize: number): Promise<Result<Page<RecipeFoodHit>, Failure>>;
  searchProducts(query: string, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>>;
  listCategories(page: number, pageSize: number): Promise<Result<Page<FoodCategory>, Failure>>;
  /** Curated products, one row per variant; a null category lists every shelf. */
  listProducts(category: string | null, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>>;
  getProduct(foodId: string): Promise<Result<FoodDetail, Failure>>;
  getBrandedProduct(barcode: string): Promise<Result<FoodDetail, Failure>>;
  listRecent(page: number, pageSize: number): Promise<Result<Page<RecentFood>, Failure>>;
}

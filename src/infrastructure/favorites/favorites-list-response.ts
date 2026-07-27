import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

/**
 * `GET /me/favorites` — a page of the user's saved recipes.
 *
 * The endpoint returns the same lean list items as the feed, in favourite
 * order. The client used to keep only `id` from each and re-find the rows in
 * whatever page the FEED happened to be holding, which made the saved grid
 * change with an unrelated screen's search and sort.
 */
export interface FavoritesListResponse {
  items: RecipeListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

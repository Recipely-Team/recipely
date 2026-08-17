import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

/**
 * `GET /me/likes` — a page of the recipes the user has liked, newest like
 * first.
 *
 * The endpoint returns the same lean list items as the feed and as
 * `/me/favorites`, so the liked grid renders the response directly instead of
 * looking the rows up in whatever page some other screen happens to hold.
 */
export interface LikedRecipesResponse {
  items: RecipeListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

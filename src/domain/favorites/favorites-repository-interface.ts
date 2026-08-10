import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * Repository interface for favorite/bookmark operations.
 * Defines contract for adding and removing recipes from user's favorites.
 */
export interface FavoritesRepositoryInterface {
  /**
   * Add a recipe to the user's favorites.
   * @param userId The ID of the user
   * @param recipeId The ID of the recipe to favorite
   * @returns Result indicating success or failure
   */
  addFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>>;

  /**
   * Remove a recipe from the user's favorites.
   * @param userId The ID of the user
   * @param recipeId The ID of the recipe to unfavorite
   * @returns Result indicating success or failure
   */
  removeFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>>;

  /**
   * The current user's saved recipes, in favourite order.
   *
   * Returns the rows themselves rather than ids: the saved grid renders these
   * directly, so it no longer depends on the discover feed having the same
   * recipes in its currently-loaded (searched, filtered, sorted) page.
   */
  listFavorites(): Promise<Result<RecipeSummaryEntity[], Failure>>;
}

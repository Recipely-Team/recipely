import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** Repository port for recipe likes: toggling one, and listing the user's own. */
export interface LikeRepositoryInterface {
  like(recipeId: string): Promise<Result<void, Failure>>;
  unlike(recipeId: string): Promise<Result<void, Failure>>;
  /**
   * The current user's liked recipes, newest like first.
   *
   * Returns the rows themselves rather than ids, for the same reason favourites
   * does: the liked grid renders these directly instead of depending on another
   * screen having the same recipes in its currently-loaded page.
   */
  listLiked(): Promise<Result<RecipeSummaryEntity[], Failure>>;
}

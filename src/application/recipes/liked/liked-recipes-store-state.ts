import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { LikedRecipesListState } from '@application/recipes/liked/liked-recipes-list-state';

export interface LikedRecipesStoreState {
  /**
   * The liked recipes themselves, newest like first — what the My Recipes
   * "Liked" grid renders. Held here rather than derived from `likesStore`,
   * which only knows about recipes some screen has already shown.
   */
  likedRecipes: readonly RecipeSummaryEntity[];
  /** Load status of `likedRecipes` — what the liked grid shows a skeleton for. */
  listState: LikedRecipesListState;
  /** Replaces the rows from one `/me/likes` response. */
  setLiked: (recipes: readonly RecipeSummaryEntity[]) => void;
  /**
   * Drops a row the user just unliked somewhere else in the app. The next load
   * would do it too, but not before the user has looked at a grid still showing
   * a recipe they took the heart off.
   */
  removeLocal: (id: string) => void;
  /**
   * Fetches the liked recipes, folds the outcome into `listState`, and hands
   * the same outcome back — a caller that pulled to refresh needs to know how
   * ITS load ended, which a shared field cannot say once two loads overlap.
   */
  loadLiked: () => Promise<Result<readonly RecipeSummaryEntity[], Failure>>;
  /** Drops the signed-in user's liked recipes. Called when the session ends. */
  clear: () => void;
}

import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { SavedRecipesListState } from '@application/recipes/saved/saved-recipes-list-state';

export interface SavedRecipesStoreState {
  /**
   * The saved recipes themselves, in favourite order — what the My Recipes
   * saved grid renders. Held here rather than derived from the discover feed's
   * loaded page, which is scoped by that screen's search, filters and sort.
   */
  savedRecipes: readonly RecipeSummaryEntity[];
  savedIds: ReadonlySet<string>;
  /** Load status of `savedRecipes` — what the saved grid shows a skeleton for. */
  listState: SavedRecipesListState;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  addLocal: (id: string) => void;
  removeLocal: (id: string) => void;
  /** Replaces both the rows and the id set from one favourites response. */
  setSaved: (recipes: readonly RecipeSummaryEntity[]) => void;
  /** Fetches the favourites and folds the outcome into `listState`. */
  loadSaved: () => Promise<void>;
  /** Drops the signed-in user's saved recipes. Called when the session ends. */
  clear: () => void;
}

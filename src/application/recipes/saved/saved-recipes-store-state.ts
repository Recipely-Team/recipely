import type { Page } from '@domain/common/page';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
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
  setSaved: (page: Page<RecipeSummaryEntity>) => void;
  /**
   * Fetches the favourites, folds the outcome into `listState`, and hands the
   * same outcome back — a caller that pulled to refresh needs to know how ITS
   * load ended, which a shared field cannot say once two loads overlap.
   */
  loadSaved: () => Promise<Result<Page<RecipeSummaryEntity>, Failure>>;
  /** The next page of saved recipes, appended; a no-op once the server's total is reached. */
  loadMoreSaved: () => Promise<void>;
  /** The server's total and whether more pages exist — the tab count reads `total`, not the array. */
  paging: ListPaging;
  /** Drops the signed-in user's saved recipes. Called when the session ends. */
  clear: () => void;
}

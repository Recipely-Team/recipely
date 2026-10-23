import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { PagedList } from '@application/store/paging/paged-list';

export interface MyRecipesStore {
  /** The viewer's own recipes, paged on scroll; `ListLoaded` holds rows, total and next-page state together. */
  mine: PagedList<RecipeSummaryEntity>;
  /** The first page again; a failed reload keeps the rows and answers its `Failure`, `null` when it landed. */
  loadMine: () => Promise<Failure | null>;
  /** The next page, appended; a no-op once the server's total is reached. */
  loadMoreMine: () => Promise<void>;
  /** A recipe the viewer just created, at the top and counted. */
  addLocal: (recipe: RecipeSummaryEntity) => void;
  /** A recipe the viewer deleted, keeping the next page's offset right. */
  removeLocal: (id: string) => void;
  /** Drops the signed-in user's recipes. Called when the session ends. */
  clear: () => void;
}

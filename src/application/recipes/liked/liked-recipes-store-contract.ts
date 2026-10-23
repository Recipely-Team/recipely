import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { PagedList } from '@application/store/paging/paged-list';

export interface LikedRecipesStore {
  /** The recipes the viewer liked, paged on scroll; `ListLoaded` holds rows, total and next-page state together. */
  liked: PagedList<RecipeSummaryEntity>;
  /** Drops an unliked recipe from the list, keeping the next page's offset right. */
  removeLocal: (id: string) => void;
  /** The first page again; a failed reload keeps the rows and answers its `Failure`, `null` when it landed. */
  loadLiked: () => Promise<Failure | null>;
  /** The next page, appended; a no-op once the server's total is reached. */
  loadMoreLiked: () => Promise<void>;
  /** Drops the signed-in user's liked recipes. Called when the session ends. */
  clear: () => void;
}

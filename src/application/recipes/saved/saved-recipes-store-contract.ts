import type { Page } from '@domain/common/page';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { PagedList } from '@application/store/paging/paged-list';

export interface SavedRecipesStore {
  /**
   * The saved recipes, in favourite order and paged on scroll. `ListLoaded`
   * holds the rows, the server's total (what the tab count shows) and the
   * next-page state together, so they cannot disagree.
   */
  saved: PagedList<RecipeSummaryEntity>;
  /** Which recipes are saved: drives the bookmark on every card in the app. */
  savedIds: ReadonlySet<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  addLocal: (id: string) => void;
  removeLocal: (id: string) => void;
  /** Adopts a first page someone else fetched (the sign-in pre-load). */
  setSaved: (page: Page<RecipeSummaryEntity>) => void;
  /**
   * The first page again: a skeleton the first time, otherwise in place. A
   * failed reload keeps the rows and answers its `Failure` to the caller (a
   * pull to refresh shows it); `null` when it landed.
   */
  loadSaved: () => Promise<Failure | null>;
  /** The next page, appended; a no-op once the server's total is reached. */
  loadMoreSaved: () => Promise<void>;
  /** Drops the signed-in user's saved recipes. Called when the session ends. */
  clear: () => void;
}

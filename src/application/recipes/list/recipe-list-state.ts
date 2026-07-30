import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export type RecipeListState =
  | { status: 'idle' }
  | { status: 'loading' }
  // WHY: `isRefreshing`/`refreshFailure` let a filter change on an already
  // -loaded list keep the previous `recipes` on screen while a new page
  // fetches, instead of dropping back to a bare `loading` state with no
  // data. `recipes` is always readable here regardless of whether a
  // refresh is in flight, so screens don't need to branch on refreshing
  // vs. loaded just to render the list.
  | {
      status: 'loaded';
      recipes: RecipeSummaryEntity[];
      /**
       * The `RecipeFilters.search` these `recipes` are the answer to — empty
       * for the unfiltered feed.
       *
       * Search is server-side and debounced, so between a keystroke and its
       * response `recipes` still holds the PREVIOUS answer. Screens compare
       * this with the query currently typed to tell "these rows match what is
       * being asked" from "these rows are last question's answer", instead of
       * rendering whatever is loaded as results.
       */
      query: string;
      isRefreshing?: boolean;
      refreshFailure?: Failure;
    }
  | { status: 'error'; failure: Failure };

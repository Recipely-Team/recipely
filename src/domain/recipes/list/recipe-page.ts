import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * One page of recipes, with enough context to ask for the next.
 *
 * The repository used to return a bare `RecipeSummaryEntity[]` and drop the
 * envelope the backend sends, so nothing above it could tell a full page from
 * the last one — and the app fetched page 1 forever. `hasMore` is derived here
 * rather than left to each caller to recompute from `total`.
 */
export interface RecipePage {
  items: RecipeSummaryEntity[];
  /** Total matching recipes across every page, as the backend counts them. */
  total: number;
  /** 1-based, matching the API. */
  page: number;
  pageSize: number;
  /** True while pages remain after this one. */
  hasMore: boolean;
}

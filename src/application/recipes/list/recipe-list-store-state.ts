import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';

export interface RecipeListStoreState {
  state: RecipeListState;
  load: (filters?: RecipeFilters) => Promise<void>;
  /** Appends the next page; a no-op when the last page is already loaded. */
  loadMore: (filters?: RecipeFilters) => Promise<void>;
  remove: (id: string) => void;
}

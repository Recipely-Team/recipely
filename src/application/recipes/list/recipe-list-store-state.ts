import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';

export interface RecipeListStoreState {
  state: RecipeListState;
  load: (filters?: RecipeFilters) => Promise<void>;
  replace: (recipe: RecipeSummaryEntity) => void;
  remove: (id: string) => void;
}

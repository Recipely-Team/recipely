import type { TrendingRecipesState } from '@application/recipes/trending/trending-recipes-state';

export interface TrendingRecipesStore {
  state: TrendingRecipesState;
  load: (limit?: number) => Promise<void>;
}

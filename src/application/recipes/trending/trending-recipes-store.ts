import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { TrendingRecipesStoreState } from '@application/recipes/trending/trending-recipes-store-state';
import type { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';

interface TrendingRecipesStoreDeps {
  listTrendingRecipes: ListTrendingRecipesUseCase;
}

export const configureTrendingRecipesStore = (
  deps: TrendingRecipesStoreDeps,
): BoundStore<TrendingRecipesStoreState> => {
  return create<TrendingRecipesStoreState>((set) => ({
    state: { status: 'idle' }, // TO DO: static status name problem
    load: async (limit?: number) => {
      set({ state: { status: 'loading' } }); // TO DO: static status name problem
      const result = await deps.listTrendingRecipes.execute(limit);
      if (!result.ok) {
        set({ state: { status: 'error', failure: result.failure } }); // TO DO: static status name problem
        return;
      }
      set({ state: { status: 'loaded', recipes: result.value } }); // TO DO: static status name problem
    },
  }));
};

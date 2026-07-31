import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { TrendingRecipesStoreState } from '@application/recipes/trending/trending-recipes-store-state';
import type { TrendingRecipesStoreDeps } from '@application/recipes/trending/trending-recipes-store-deps';

export const configureTrendingRecipesStore = (
  deps: TrendingRecipesStoreDeps,
): BoundStore<TrendingRecipesStoreState> => {
  return create<TrendingRecipesStoreState>((set) => ({
    state: { status: 'idle' },
    load: async (limit?: number) => {
      set({ state: { status: 'loading' } });
      const result = await deps.listTrendingRecipes.execute(limit);
      if (!result.ok) {
        set({ state: { status: 'error', failure: result.failure } });
        return;
      }
      set({ state: { status: 'loaded', recipes: result.value } });
    },
  }));
};

import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
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
    state: { status: StoreStatus.Idle },
    load: async (limit?: number) => {
      set({ state: { status: StoreStatus.Loading } });
      const result = await deps.listTrendingRecipes.execute(limit);
      if (!result.ok) {
        set({ state: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      set({ state: { status: StoreStatus.Loaded, recipes: result.value } });
    },
  }));
};

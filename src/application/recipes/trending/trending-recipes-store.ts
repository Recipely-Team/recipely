import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { createStore } from 'zustand/vanilla';
import type { TrendingRecipesStore } from '@application/recipes/trending/trending-recipes-store-contract';
import type { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';

interface TrendingRecipesStoreDeps {
  listTrendingRecipes: ListTrendingRecipesUseCase;
}

export const configureTrendingRecipesStore = (
  deps: TrendingRecipesStoreDeps,
): StoreApi<TrendingRecipesStore> => {
  return createStore<TrendingRecipesStore>((set) => ({
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

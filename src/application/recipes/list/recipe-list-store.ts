import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import { CharConstants, ValueConstants } from '@core/constants';
import { RequestEpoch } from '@application/store/request-epoch';

import type { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';

interface RecipeListStoreDeps {
  listRecipes: ListRecipesUseCase;
}

export const configureRecipeListStore = (deps: RecipeListStoreDeps): BoundStore<RecipeListStoreState> => {
  // Only the latest load may write; `isLatestLoad` is that load's check, which an append borrows.
  const epoch = new RequestEpoch();
  let isLatestLoad = epoch.start();

  return create<RecipeListStoreState>((set, get) => ({
    state: { status: StoreStatus.Idle },
    // A filter change re-fetches in place (isRefreshing) instead of blanking the list.
    load: async (filters?: RecipeFilters) => {
      // Responses can arrive out of order: only the latest request may write.
      const isCurrent = epoch.start();
      isLatestLoad = isCurrent;

      const current = get().state;
      if (current.status === StoreStatus.Loaded) {
        set({ state: { ...current, isRefreshing: true, refreshFailure: undefined } });
      } else {
        set({ state: { status: StoreStatus.Loading } });
      }
      const result = await deps.listRecipes.execute(filters);
      if (!isCurrent()) return;
      if (!result.ok) {
        set((s) => ({
          state:
            s.state.status === StoreStatus.Loaded
              ? { ...s.state, isRefreshing: false, refreshFailure: result.failure }
              : { status: StoreStatus.Error, failure: result.failure },
        }));
        return;
      }
      set({
        state: {
          status: StoreStatus.Loaded,
          recipes: [...result.value.items],
          query: filters?.search ?? CharConstants.empty,
          page: result.value.page,
          hasMore: result.value.hasMore,
          total: result.value.total,
        },
      });
    },

    /**
     * Appends the next page to what is already on screen.
     *
     * Separate from `load` because it must NOT blank the list or start a
     * new request epoch the way `load` does: an appending fetch is not a new
     * question, so a filter change landing mid-append should win, and this
     * one's answer is dropped if it does. A no-op unless a loaded page says
     * there is more and nothing is already appending.
     */
    loadMore: async (filters?: RecipeFilters) => {
      const current = get().state;
      if (current.status !== StoreStatus.Loaded || !current.hasMore || current.isLoadingMore === true) return;

      const isCurrent = isLatestLoad;
      const nextPage = current.page + ValueConstants.one;
      set({ state: { ...current, isLoadingMore: true } });

      const result = await deps.listRecipes.execute({ ...filters, page: nextPage });
      if (!isCurrent()) return;

      const state = get().state;
      if (state.status !== StoreStatus.Loaded) return;
      if (!result.ok) {
        set({ state: { ...state, isLoadingMore: false, refreshFailure: result.failure } });
        return;
      }
      set({
        state: {
          ...state,
          recipes: [...state.recipes, ...result.value.items],
          page: result.value.page,
          hasMore: result.value.hasMore,
          total: result.value.total,
          isLoadingMore: false,
        },
      });
    },
    remove: (id) =>
      set((s) => {
        if (s.state.status !== StoreStatus.Loaded) return s;
        return {
          state: {
            ...s.state,
            recipes: s.state.recipes.filter((r) => r.id !== id),
          },
        };
      }),
  }));
};

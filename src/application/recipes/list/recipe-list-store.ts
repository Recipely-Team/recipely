import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { RecipeListStoreDeps } from '@application/recipes/list/recipe-list-store-deps';
import { CharConstants, ValueConstants } from '@core/constants';

export const configureRecipeListStore = (deps: RecipeListStoreDeps): RecipeListStore => {
  // Sequence number of the most recent `load`. Responses that do not carry it
  // are answers to a question the user has already moved on from — see `load`.
  let latestRequest = ValueConstants.zero;

  return create<RecipeListStoreState>((set, get) => ({
    state: { status: 'idle' },
    // WHY: a filter change while a list is already `loaded` re-fetches in
    // place — the previous `recipes` stay on screen (with `isRefreshing:
    // true`) instead of resetting to a data-less `loading` state, so the
    // header/filter chips a screen renders only in the `loaded` branch
    // don't get unmounted mid-refetch. The very first load from `idle`
    // still transitions to plain `loading` (there's nothing to preserve).
    // A failed refresh keeps showing the stale `recipes` and surfaces the
    // error via `refreshFailure` rather than blanking the screen.
    load: async (filters?: RecipeFilters) => {
      // WHY: search-as-you-type puts several loads in flight at once, and
      // responses do not have to come back in the order they were sent. Without
      // this guard the LAST-ARRIVING answer won, so a slow request for "kek"
      // landing after a fast one for "kekli" left the list showing results for
      // a query the user had already typed past. Each call takes a sequence
      // number and only the newest one is allowed to write; a superseded
      // response is dropped whole — including its failure, which belongs to an
      // abandoned question, and its `isRefreshing: false`, which would clear
      // the spinner the newer request is still earning.
      const requestId = latestRequest + ValueConstants.one;
      latestRequest = requestId;

      const current = get().state;
      if (current.status === 'loaded') {
        set({ state: { ...current, isRefreshing: true, refreshFailure: undefined } });
      } else {
        set({ state: { status: 'loading' } });
      }
      const result = await deps.listRecipes.execute(filters);
      if (requestId !== latestRequest) return;
      if (!result.ok) {
        set((s) => ({
          state:
            s.state.status === 'loaded'
              ? { ...s.state, isRefreshing: false, refreshFailure: result.failure }
              : { status: 'error', failure: result.failure },
        }));
        return;
      }
      set({
        state: {
          status: 'loaded',
          recipes: result.value,
          query: filters?.search ?? CharConstants.empty,
        },
      });
    },
    remove: (id) =>
      set((s) => {
        if (s.state.status !== 'loaded') return s;
        return {
          state: {
            ...s.state,
            recipes: s.state.recipes.filter((r) => r.id !== id),
          },
        };
      }),
  }));
};

/** Bound Zustand store handle produced by `configureRecipeListStore`. */
export type RecipeListStore = UseBoundStore<StoreApi<RecipeListStoreState>>;

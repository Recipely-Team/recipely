import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import { TaxonomyStatus } from '@application/recipes/taxonomy/taxonomy-status';

import type { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';

interface TaxonomyStoreDeps {
  loadTaxonomyUseCase: LoadTaxonomyUseCase;
}

export const configureTaxonomyStore = (deps: TaxonomyStoreDeps): BoundStore<TaxonomyStoreState> => {
  const fetchCatalogs = async (
    set: (partial: Partial<TaxonomyStoreState>) => void,
  ): Promise<void> => {
    set({ status: 'loading', failure: null }); // TO DO: static status name problem
    const result = await deps.loadTaxonomyUseCase.execute();
    if (!result.ok) {
      set({ status: 'error', failure: result.failure }); // TO DO: static status name problem
      return;
    }
    set({
      cuisines: result.value.cuisines,
      categories: result.value.categories,
      status: TaxonomyStatus.Ready,
      failure: null,
    });
  };

  return create<TaxonomyStoreState>((set, get) => ({
    cuisines: [],
    categories: [],
    status: 'idle', // TO DO: static status name problem
    failure: null,
    load: async () => {
      const { status } = get();
      if (status === TaxonomyStatus.Loading || status === TaxonomyStatus.Ready) {
        return;
      }
      await fetchCatalogs(set);
    },
    reload: async () => {
      if (get().status === 'loading') {
        return;
      }
      await fetchCatalogs(set);
    },
  }));
};

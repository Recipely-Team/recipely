import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { TaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store-contract';

import type { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';

interface TaxonomyStoreDeps {
  loadTaxonomyUseCase: LoadTaxonomyUseCase;
}

export const configureTaxonomyStore = (deps: TaxonomyStoreDeps): BoundStore<TaxonomyStore> => {
  const fetchCatalogs = async (
    set: (partial: Partial<TaxonomyStore>) => void,
  ): Promise<void> => {
    set({ status: StoreStatus.Loading, failure: null });
    const result = await deps.loadTaxonomyUseCase.execute();
    if (!result.ok) {
      set({ status: StoreStatus.Error, failure: result.failure });
      return;
    }
    set({
      cuisines: result.value.cuisines,
      categories: result.value.categories,
      status: StoreStatus.Ready,
      failure: null,
    });
  };

  return create<TaxonomyStore>((set, get) => ({
    cuisines: [],
    categories: [],
    status: StoreStatus.Idle,
    failure: null,
    load: async () => {
      const { status } = get();
      if (status === StoreStatus.Loading || status === StoreStatus.Ready) {
        return;
      }
      await fetchCatalogs(set);
    },
    reload: async () => {
      if (get().status === StoreStatus.Loading) {
        return;
      }
      await fetchCatalogs(set);
    },
  }));
};

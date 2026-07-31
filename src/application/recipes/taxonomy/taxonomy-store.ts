import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import type { TaxonomyStoreDeps } from '@application/recipes/taxonomy/taxonomy-store-deps';
import { TaxonomyStatus } from '@application/recipes/taxonomy/taxonomy-status';

export const configureTaxonomyStore = (deps: TaxonomyStoreDeps): TaxonomyStore => {
  const fetchCatalogs = async (
    set: (partial: Partial<TaxonomyStoreState>) => void,
  ): Promise<void> => {
    set({ status: 'loading', failure: null });
    const result = await deps.loadTaxonomyUseCase.execute();
    if (!result.ok) {
      set({ status: 'error', failure: result.failure });
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
    status: 'idle',
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

/** Bound Zustand store handle produced by `configureTaxonomyStore`. */
export type TaxonomyStore = UseBoundStore<StoreApi<TaxonomyStoreState>>;

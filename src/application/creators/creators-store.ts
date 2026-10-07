import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import { FIRST_PAGE } from '@domain/common/first-page';
import { PageSizes } from '@application/config/page-sizes';
import type { CreatorsStoreState } from '@application/creators/creators-store-state';
import type { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';

interface CreatorsStoreDeps {
  listCreators: ListCreatorsUseCase;
}

/**
 * The Explore "Creators" strip.
 *
 * @remarks
 * - **Not session-scoped.** The list is public (guests see it too), so
 *   sign-out does not clear it.
 * - **A refresh never shows a skeleton over a loaded strip**; only the very
 *   first load announces `Loading`. A failed refresh of a loaded strip keeps
 *   its rows, since a strip that vanishes on a flaky network reads as "no
 *   creators".
 * - **The newest first-page request wins.** `generation` is bumped by each
 *   first-page request, and an answer from an older one — or a `loadMore`
 *   started before it — is dropped.
 */
export const configureCreatorsStore = (deps: CreatorsStoreDeps): BoundStore<CreatorsStoreState> => {
  let generation = ValueConstants.zero;

  return create<CreatorsStoreState>((set, get) => {
    const fetchFirstPage = async (): Promise<void> => {
      generation += ValueConstants.one;
      const requested = generation;
      if (get().listState.status !== StoreStatus.Loaded) set({ listState: { status: StoreStatus.Loading } });
      const result = await deps.listCreators.execute({ page: FIRST_PAGE, pageSize: PageSizes.creators });
      if (requested !== generation) return;
      if (!result.ok) {
        const shown = get().listState;
        // A loaded strip keeps its rows; a `loadMore` dropped by the bump above no longer spins.
        set({
          listState:
            shown.status === StoreStatus.Loaded
              ? { ...shown, isLoadingMore: false }
              : { status: StoreStatus.Error, failure: result.failure },
        });
        return;
      }
      const { items, page, hasMore } = result.value;
      set({ creators: [...items], listState: { status: StoreStatus.Loaded, page, hasMore } });
    };

    return {
      creators: [],
      listState: { status: StoreStatus.Idle },
      load: async () => {
        const { status } = get().listState;
        if (status === StoreStatus.Loading || status === StoreStatus.Loaded) return;
        await fetchFirstPage();
      },
      refresh: fetchFirstPage,
      loadMore: async () => {
        const current = get().listState;
        if (current.status !== StoreStatus.Loaded || !current.hasMore || current.isLoadingMore === true) {
          return;
        }
        const requested = generation;
        set({ listState: { ...current, isLoadingMore: true } });
        const result = await deps.listCreators.execute({
          page: current.page + ValueConstants.one,
          pageSize: PageSizes.creators,
        });
        if (requested !== generation) return;
        if (!result.ok) {
          set({ listState: { ...current, isLoadingMore: false } });
          return;
        }
        const known = new Set(get().creators.map((c) => c.id));
        const fresh = result.value.items.filter((c) => !known.has(c.id));
        set({
          creators: [...get().creators, ...fresh],
          listState: { status: StoreStatus.Loaded, page: result.value.page, hasMore: result.value.hasMore },
        });
      },
    };
  });
};

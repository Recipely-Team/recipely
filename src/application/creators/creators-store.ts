import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { createStore } from 'zustand/vanilla';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { CreatorsStore } from '@application/creators/creators-store-contract';
import type { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';

interface CreatorsStoreDeps {
  listCreators: ListCreatorsUseCase;
}

/**
 * The Explore "Creators" strip, paged by a {@link PagedListLoader}.
 *
 * @remarks
 * - **Not session-scoped.** The list is public (guests see it too), so
 *   sign-out does not clear it.
 * - **A refresh never shows a skeleton over a loaded strip**, and a failed
 *   refresh keeps its rows: a strip that vanishes on a flaky network reads as
 *   "no creators".
 * - **The newest first-page request wins**; a next page started before it is
 *   dropped (the loader's generation).
 */
export const configureCreatorsStore = (deps: CreatorsStoreDeps): StoreApi<CreatorsStore> =>
  createStore<CreatorsStore>((set, get) => {
    const loader = new PagedListLoader(
      () => get().creators,
      (creators) => set({ creators }),
      (creator) => creator.id,
    );
    const fetchPage = (page: number) => deps.listCreators.execute(page);

    return {
      creators: { status: StoreStatus.Idle },
      load: async () => {
        const { status } = get().creators;
        if (status === StoreStatus.Loading || status === StoreStatus.Loaded) return;
        await loader.load(fetchPage);
      },
      refresh: async () => {
        await loader.refresh(fetchPage);
      },
      loadMore: () => loader.loadMore(),
    };
  });

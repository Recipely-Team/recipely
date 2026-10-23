import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { createStore } from 'zustand/vanilla';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { MyRecipesStore } from '@application/recipes/my-recipes/my-recipes-store-contract';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

interface MyRecipesStoreDeps {
  listMyRecipesUseCase: ListMyRecipesUseCase;
}

/**
 * The viewer's own recipes for the Created tab.
 *
 * @remarks
 * - **Split out of the authoring store.** The list used to share one store with
 *   the create, generate, refine and delete flows, so every keystroke of a
 *   generation's progress was also a change to "my recipes".
 * - **One `PagedList` via `PagedListLoader`**: the newest load wins, a removal
 *   shifts the next page's offset, and `clear()` drops answers still in flight.
 */
export const configureMyRecipesStore = (deps: MyRecipesStoreDeps): StoreApi<MyRecipesStore> =>
  createStore<MyRecipesStore>((set, get) => {
    const loader = new PagedListLoader<RecipeSummaryEntity>(() => get().mine, (mine) => set({ mine }), (r) => r.id);
    const fetchPage = (page: number) => deps.listMyRecipesUseCase.execute(page);
    return {
      mine: { status: StoreStatus.Idle },
      loadMine: () => loader.refresh(fetchPage),
      loadMoreMine: () => loader.loadMore(),
      addLocal: (recipe) => loader.upsertItem(recipe),
      removeLocal: (id) => loader.removeItem(id),
      clear: () => loader.reset(),
    };
  });

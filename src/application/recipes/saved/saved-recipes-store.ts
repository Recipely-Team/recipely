import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store-contract';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { PagedList } from '@application/store/paging/paged-list';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

interface SavedRecipesStoreDeps {
  loadFavoritesUseCase: LoadFavoritesUseCase;
}

/**
 * The viewer's saved recipes, and which recipes are saved.
 *
 * @remarks
 * - **One `PagedList`, driven by `PagedListLoader`.** Rows, status and cursor
 *   used to sit in three fields kept in step by hand; the loader owns them now,
 *   with the newest load winning and removals shifting the next page's offset.
 * - **`savedIds` follows the rows that land** and local saves in between, so
 *   every bookmark in the app reads one set.
 * - **`clear()` resets the loader**, dropping any answer still in flight: a
 *   load started under the previous account must not put its rows back.
 */
export const configureSavedRecipesStore = (deps: SavedRecipesStoreDeps): BoundStore<SavedRecipesStore> =>
  create<SavedRecipesStore>((set, get) => {
    const write = (saved: PagedList<RecipeSummaryEntity>): void =>
      set(saved.status === StoreStatus.Loaded ? { saved, savedIds: new Set(saved.items.map((r) => r.id)) } : { saved });
    const loader = new PagedListLoader<RecipeSummaryEntity>(() => get().saved, write, (r) => r.id);
    const fetchPage = (page: number) => deps.loadFavoritesUseCase.execute(page);
    const forget = (id: string): void => {
      const next = new Set(get().savedIds);
      next.delete(id);
      set({ savedIds: next });
      loader.removeItem(id);
    };

    return {
      saved: { status: StoreStatus.Idle },
      savedIds: new Set<string>(),
      has: (id) => get().savedIds.has(id),
      toggle: (id) => (get().savedIds.has(id) ? forget(id) : get().addLocal(id)),
      addLocal: (id) => {
        if (get().savedIds.has(id)) return;
        set({ savedIds: new Set(get().savedIds).add(id) });
      },
      removeLocal: (id) => {
        if (get().savedIds.has(id)) forget(id);
      },
      setSaved: (page) => loader.settle(loader.begin(fetchPage), ok(page)),
      loadSaved: () => loader.refresh(fetchPage),
      loadMoreSaved: () => loader.loadMore(),
      clear: () => {
        loader.reset();
        set({ savedIds: new Set<string>() });
      },
    };
  });

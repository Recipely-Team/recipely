import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { RequestEpoch } from '@application/store/request-epoch';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store-contract';
import { pagingOf } from '@application/store/paging/list-paging/paging-of';
import { NO_PAGING } from '@application/store/paging/list-paging/no-paging';
import { loadMorePaging } from '@application/store/paging/list-paging/load-more-paging';
import { pagingAfterRemoval } from '@application/store/paging/list-paging/paging-after-removal';
import { appendById } from '@application/store/paging/append-by-id';


interface SavedRecipesStoreDeps {
  loadFavoritesUseCase: LoadFavoritesUseCase;
}

export const configureSavedRecipesStore = (
  deps: SavedRecipesStoreDeps,
): BoundStore<SavedRecipesStore> => {
  /**
   * Invalidated by `clear()`; a newer load also wins. A load that started under
   * an earlier session must not publish its answer: signing out while a
   * favourites request was in flight
   * repopulated the previous account's rows — and `savedIds` drives the
   * bookmark on every recipe card in the app.
   */
  const epoch = new RequestEpoch();

  return create<SavedRecipesStore>((set, get) => ({
    savedRecipes: [],
    savedIds: new Set<string>(),
    listState: { status: StoreStatus.Idle },
    paging: NO_PAGING,
    has: (id) => get().savedIds.has(id),
    toggle: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        if (next.has(id)) {
          next.delete(id);
          // Unsaving removes the card from the saved grid.
          return { savedIds: next, savedRecipes: s.savedRecipes.filter((r) => r.id !== id), paging: pagingAfterRemoval(s.paging) };
        }
        next.add(id);
        return { savedIds: next };
      }),
    addLocal: (id) =>
      set((s) => {
        if (s.savedIds.has(id)) return s;
        const next = new Set(s.savedIds);
        next.add(id);
        return { savedIds: next };
      }),
    removeLocal: (id) =>
      set((s) => {
        if (!s.savedIds.has(id)) return s;
        const next = new Set(s.savedIds);
        next.delete(id);
        return { savedIds: next, savedRecipes: s.savedRecipes.filter((r) => r.id !== id), paging: pagingAfterRemoval(s.paging) };
      }),
    setSaved: (page) =>
      set({
        savedRecipes: page.items,
        savedIds: new Set(page.items.map((r) => r.id)),
        listState: { status: StoreStatus.Loaded },
        paging: pagingOf(page),
      }),
    loadMoreSaved: () => {
      const isCurrent = epoch.current();
      return loadMorePaging({
        read: () => get().paging,
        write: (paging) => set({ paging }),
        fetch: (page) => deps.loadFavoritesUseCase.execute(page),
        isCurrent,
        append: (items) =>
          set((s) => {
            const savedRecipes = appendById(s.savedRecipes, items);
            return { savedRecipes, savedIds: new Set(savedRecipes.map((r) => r.id)) };
          }),
      });
    },
    loadSaved: async () => {
      const isCurrent = epoch.start();
      // Only the first load shows a skeleton.
      if (get().listState.status !== StoreStatus.Loaded) {
        set({ listState: { status: StoreStatus.Loading } });
      }
      const result = await deps.loadFavoritesUseCase.execute();
      if (!isCurrent()) return result;
      if (!result.ok) {
        // A failed reload keeps the rows; a next page it superseded is no longer on its way.
        set((s) => ({ listState: { status: StoreStatus.Error, failure: result.failure }, paging: { ...s.paging, isLoadingMore: false } }));
        return result;
      }
      get().setSaved(result.value);
      return result;
    },
    clear: () => {
      epoch.invalidate();
      set({
        savedRecipes: [],
        savedIds: new Set<string>(),
        listState: { status: StoreStatus.Idle },
        paging: NO_PAGING,
      });
    },
  }));
};

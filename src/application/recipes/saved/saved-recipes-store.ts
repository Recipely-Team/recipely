import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

interface SavedRecipesStoreDeps {
  loadFavoritesUseCase: LoadFavoritesUseCase;
}

export const configureSavedRecipesStore = (
  deps: SavedRecipesStoreDeps,
): BoundStore<SavedRecipesStoreState> => {
  /**
   * Bumped by `clear()`. A load that started under an earlier session must not
   * publish its answer: signing out while a favourites request was in flight
   * repopulated the previous account's rows — and `savedIds` drives the
   * bookmark on every recipe card in the app.
   */
  let session = ValueConstants.zero;

  return create<SavedRecipesStoreState>((set, get) => ({
    savedRecipes: [],
    savedIds: new Set<string>(),
    listState: { status: StoreStatus.Idle },
    has: (id) => get().savedIds.has(id),
    toggle: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        if (next.has(id)) {
          next.delete(id);
          // Unsaving from the saved grid must take the card with it, or the row
          // sits there un-bookmarked until the next load.
          return { savedIds: next, savedRecipes: s.savedRecipes.filter((r) => r.id !== id) };
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
        return { savedIds: next, savedRecipes: s.savedRecipes.filter((r) => r.id !== id) };
      }),
    setSaved: (recipes) =>
      set({
        savedRecipes: recipes,
        savedIds: new Set(recipes.map((r) => r.id)),
        listState: { status: StoreStatus.Loaded },
      }),
    loadSaved: async () => {
      const requested = session;
      // Only the FIRST load announces itself: a reload of a grid that is
      // already on screen keeps its `Loaded` state, or every re-focus — and
      // every pull-to-refresh — would swap the rows for a skeleton.
      if (get().listState.status !== StoreStatus.Loaded) {
        set({ listState: { status: StoreStatus.Loading } });
      }
      const result = await deps.loadFavoritesUseCase.execute();
      if (requested !== session) return result;
      if (!result.ok) {
        // The rows already on screen stay: a failed reload must not blank the
        // grid the user is looking at.
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
        return result;
      }
      get().setSaved(result.value);
      return result;
    },
    clear: () => {
      session += ValueConstants.one;
      set({
        savedRecipes: [],
        savedIds: new Set<string>(),
        listState: { status: StoreStatus.Idle },
      });
    },
  }));
};

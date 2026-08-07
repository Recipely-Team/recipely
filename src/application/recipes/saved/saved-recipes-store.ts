import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

interface SavedRecipesStoreDeps {
  loadFavoritesUseCase: LoadFavoritesUseCase;
}

export const configureSavedRecipesStore = (
  deps: SavedRecipesStoreDeps,
): BoundStore<SavedRecipesStoreState> => {
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
      set({ listState: { status: StoreStatus.Loading } });
      const result = await deps.loadFavoritesUseCase.execute();
      if (!result.ok) {
        // The rows already on screen stay: a failed reload must not blank the
        // grid the user is looking at.
        set({ listState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      get().setSaved(result.value);
    },
    clear: () =>
      set({
        savedRecipes: [],
        savedIds: new Set<string>(),
        listState: { status: StoreStatus.Idle },
      }),
  }));
};

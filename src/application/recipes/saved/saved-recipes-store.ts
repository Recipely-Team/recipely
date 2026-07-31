import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

export const configureSavedRecipesStore = (): SavedRecipesStore => {
  return create<SavedRecipesStoreState>((set, get) => ({
    savedRecipes: [],
    savedIds: new Set<string>(),
    isLoading: false,
    error: null,
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
      set({ savedRecipes: recipes, savedIds: new Set(recipes.map((r) => r.id)) }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  }));
};

/** Bound Zustand store handle produced by `configureSavedRecipesStore`. */
export type SavedRecipesStore = UseBoundStore<StoreApi<SavedRecipesStoreState>>;

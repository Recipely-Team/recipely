import { create } from 'zustand';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';

export const configureSavedRecipesStore = (): SavedRecipesStore => {
  return create<SavedRecipesStoreState>((set, get) => ({
    savedIds: new Set<string>(),
    isLoading: false,
    error: null,
    has: (id) => get().savedIds.has(id),
    toggle: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
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
        return { savedIds: next };
      }),
    setSavedIds: (ids) => set({ savedIds: ids }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  }));
};

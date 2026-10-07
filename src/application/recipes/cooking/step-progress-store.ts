import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import type { StepProgressStoreState } from '@application/recipes/cooking/step-progress-store-state';

/** A copy of `flags` with `index` set to `done`; holes stay unticked. */
const withFlag = (flags: readonly boolean[] | undefined, index: number, done: boolean): readonly boolean[] => {
  const next = [...(flags ?? [])];
  next[index] = done;
  return next;
};

/**
 * Builds the step-progress store: the ticked steps of every recipe opened this session.
 *
 * @remarks
 * - **Keyed by recipe id**, so the recipe page and cook mode — two routes, two
 *   screens — read and write one list instead of each holding its own.
 */
export const configureStepProgressStore = (): BoundStore<StepProgressStoreState> =>
  create<StepProgressStoreState>((set, get) => ({
    byRecipe: {},

    toggleStep: (recipeId, index) => {
      const flags = get().byRecipe[recipeId];
      set({ byRecipe: { ...get().byRecipe, [recipeId]: withFlag(flags, index, flags?.[index] !== true) } });
    },

    setStepDone: (recipeId, index, done) => {
      if ((get().byRecipe[recipeId]?.[index] === true) === done) return;
      set({ byRecipe: { ...get().byRecipe, [recipeId]: withFlag(get().byRecipe[recipeId], index, done) } });
    },

    clear: () => set({ byRecipe: {} }),
  }));

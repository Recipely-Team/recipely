import { create } from 'zustand';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import type { BoundStore } from '@application/store/bound-store';
import type { PortionChoiceStoreState } from '@application/recipes/cooking/portion-choice-store-state';

/**
 * Builds the portion-choice store: the servings and units chosen for every
 * recipe opened this session, keyed by recipe id.
 *
 * @remarks
 * - **Holds the choice, not the rules**: `RecipeServings` bounds the count and
 *   `IngredientList.present` scales and converts, in the reader's hook.
 */
export const configurePortionChoiceStore = (): BoundStore<PortionChoiceStoreState> =>
  create<PortionChoiceStoreState>((set, get) => {
    const current = (recipeId: string) => get().byRecipe[recipeId] ?? { servings: null, system: UnitSystem.Original };
    return {
      byRecipe: {},
      setServings: (recipeId, servings) =>
        set({ byRecipe: { ...get().byRecipe, [recipeId]: { ...current(recipeId), servings } } }),
      setUnitSystem: (recipeId, system) =>
        set({ byRecipe: { ...get().byRecipe, [recipeId]: { ...current(recipeId), system } } }),
      clear: () => set({ byRecipe: {} }),
    };
  });

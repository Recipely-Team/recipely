import type { UnitSystemType } from '@domain/recipes/ingredients/unit-system';

/** One recipe's choice; `servings: null` means the recipe's own count. */
interface PortionChoice {
  servings: number | null;
  system: UnitSystemType;
}

/**
 * The servings and unit system the reader chose, per recipe, for this app session.
 *
 * @remarks
 * - **Shared by the recipe page, cook mode and both assistants**, so the amounts
 *   the cook sees, hears and adds to the shopping list are one set of lines.
 * - **In memory only**, cleared on sign-out (`clearSessionCaches`).
 */
export interface PortionChoiceStoreState {
  byRecipe: Readonly<Record<string, PortionChoice>>;
  setServings: (recipeId: string, servings: number) => void;
  setUnitSystem: (recipeId: string, system: UnitSystemType) => void;
  clear: () => void;
}

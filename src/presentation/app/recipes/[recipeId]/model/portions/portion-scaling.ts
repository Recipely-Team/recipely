import type { UnitSystemType } from '@domain/recipes/ingredients/unit-system';

/** The detail page's servings stepper and unit toggle, and the ingredient lines they produce. */
export interface PortionScaling {
  servings: number;
  canIncrement: boolean;
  canDecrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  unitSystem: UnitSystemType;
  onChangeUnitSystem: (system: UnitSystemType) => void;
  /** The recipe's ingredient lines at the chosen servings and units, index for index. */
  ingredients: readonly string[];
}

import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';

/** A portion state at the recipe's own servings, for tests that render the detail's parts. */
export const portionScalingFixture = (overrides: Partial<PortionScaling> = {}): PortionScaling => ({
  servings: 4,
  canIncrement: true,
  canDecrement: true,
  onIncrement: jest.fn(),
  onDecrement: jest.fn(),
  unitSystem: UnitSystem.Original,
  onChangeUnitSystem: jest.fn(),
  ingredients: [],
  ...overrides,
});

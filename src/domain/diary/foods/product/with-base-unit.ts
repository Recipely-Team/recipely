import { ValueConstants } from '@core/constants';
import type { FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';

/** Serving units first, then the base unit — always offered, never twice. */
export const withBaseUnit = (servingUnits: readonly FoodUnit[], base: FoodBaseUnitType): FoodUnit[] => [
  ...servingUnits.filter((unit) => unit.key !== base && unit.amount > ValueConstants.zero),
  { key: base, amount: ValueConstants.one },
];

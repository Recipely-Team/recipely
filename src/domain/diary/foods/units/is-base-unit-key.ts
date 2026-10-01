import { FoodBaseUnit, type FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';

/** Whether a unit key is `g` or `ml` rather than a serving unit like `glass`. */
export const isBaseUnitKey = (key: string): key is FoodBaseUnitType =>
  (Object.values(FoodBaseUnit) as readonly string[]).includes(key);

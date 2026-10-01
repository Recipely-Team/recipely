import { ValueConstants } from '@core/constants';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import type { ServingUnitDto } from '@infrastructure/diary/foods/dtos/serving-unit-dto';

/** Serving units in the server's order; one without a positive amount cannot be counted in and is dropped. */
export const toFoodUnits = (dtos: readonly ServingUnitDto[]): FoodUnit[] =>
  dtos.filter((dto) => dto.amount > ValueConstants.zero).map((dto) => ({ key: dto.key, amount: dto.amount }));

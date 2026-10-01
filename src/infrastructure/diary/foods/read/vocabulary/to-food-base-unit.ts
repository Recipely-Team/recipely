import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { FoodBaseUnitType } from '@domain/diary/foods/units/food-base-unit';
import { isBaseUnitKey } from '@domain/diary/foods/units/is-base-unit-key';

/** Wire `unit` → `g` / `ml`; anything else is a validation failure. */
export const toFoodBaseUnit: Mapper<string, FoodBaseUnitType, ValidationFailure> = (wire) =>
  isBaseUnitKey(wire) ? ok(wire) : fail(new ValidationFailure(DiagnosticMessage.diary.foodUnitInvalid(wire), 'unit'));

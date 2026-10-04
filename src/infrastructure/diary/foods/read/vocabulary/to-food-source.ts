import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FoodSource, type FoodSourceType } from '@domain/diary/foods/food-source';

/** Wire `source` → `FoodSource`; an unknown one is a validation failure, so the row is skipped. */
export const toFoodSource: Mapper<string, FoodSourceType, ValidationFailure> = (wire) => {
  const source = Object.values(FoodSource).find((value) => value === wire);
  return source === undefined ? fail(new ValidationFailure(DiagnosticMessage.diary.foodSourceInvalid(wire), 'source')) : ok(source);
};

import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FoodKind, type FoodKindType } from '@domain/diary/foods/food-kind';

/** Wire `kind` → `FoodKind`; an unknown one is a validation failure. */
export const toFoodKind: Mapper<string, FoodKindType, ValidationFailure> = (wire) => {
  const kind = Object.values(FoodKind).find((value) => value === wire);
  return kind === undefined ? fail(new ValidationFailure(DiagnosticMessage.diary.foodKindInvalid(wire), 'kind')) : ok(kind);
};

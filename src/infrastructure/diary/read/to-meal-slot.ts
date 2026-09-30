import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { MealSlotWire } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

const FROM_WIRE: Readonly<Record<string, MealSlotType>> = {
  [MealSlotWire.Breakfast]: MealSlot.Breakfast,
  [MealSlotWire.Lunch]: MealSlot.Lunch,
  [MealSlotWire.Dinner]: MealSlot.Dinner,
  [MealSlotWire.Snack]: MealSlot.Snacks,
};

/** Wire meal (`BREAKFAST` …) → domain `MealSlot`; an unknown value is a validation failure. */
export const toMealSlot: Mapper<string, MealSlotType, ValidationFailure> = (wire) => {
  const meal = FROM_WIRE[wire];
  return meal === undefined ? fail(new ValidationFailure(DiagnosticMessage.diary.mealInvalid(wire), 'meal')) : ok(meal);
};

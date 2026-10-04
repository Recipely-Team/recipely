import type { RequestMapper } from '@core/mapper/request-mapper';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { MealSlotWire, type MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

const TO_WIRE: Readonly<Record<MealSlotType, MealSlotWireType>> = {
  [MealSlot.Breakfast]: MealSlotWire.Breakfast,
  [MealSlot.Lunch]: MealSlotWire.Lunch,
  [MealSlot.Dinner]: MealSlotWire.Dinner,
  [MealSlot.Snacks]: MealSlotWire.Snack,
};

/** Domain `MealSlot` → the backend enum value. */
export const toMealSlotWire: RequestMapper<MealSlotType, MealSlotWireType> = (meal) => TO_WIRE[meal];

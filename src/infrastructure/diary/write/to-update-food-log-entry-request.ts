import type { RequestMapper } from '@core/mapper/request-mapper';
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { UpdateFoodLogEntryRequestDto } from '@infrastructure/diary/write/update-food-log-entry-request-dto';
import { toMealSlotWire } from '@infrastructure/diary/write/to-meal-slot-wire';

/** `FoodLogEntryChanges` → `PATCH /diary/entries/:id` body; unset fields are left out, not sent as null. */
export const toUpdateFoodLogEntryRequest: RequestMapper<FoodLogEntryChanges, UpdateFoodLogEntryRequestDto> = (changes) => ({
  ...(changes.meal !== undefined ? { meal: toMealSlotWire(changes.meal) } : {}),
  ...(changes.servings !== undefined ? { servings: changes.servings } : {}),
  ...(changes.date !== undefined ? { date: changes.date.value } : {}),
});

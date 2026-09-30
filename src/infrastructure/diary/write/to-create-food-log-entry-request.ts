import type { RequestMapper } from '@core/mapper/request-mapper';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { CreateFoodLogEntryRequestDto } from '@infrastructure/diary/write/create-food-log-entry-request-dto';
import { toMealSlotWire } from '@infrastructure/diary/write/to-meal-slot-wire';

/** `NewFoodLogEntry` → `POST /diary/entries` body; the name is trimmed, nothing is rounded. */
export const toCreateFoodLogEntryRequest: RequestMapper<NewFoodLogEntry, CreateFoodLogEntryRequestDto> = (entry) => ({
  date: entry.date.value,
  meal: toMealSlotWire(entry.meal),
  name: entry.name.trim(),
  servings: entry.servings,
  calories: entry.nutrients.calories,
  protein: entry.nutrients.protein,
  carbs: entry.nutrients.carbs,
  fat: entry.nutrients.fat,
  fiber: entry.nutrients.fiber,
  recipeId: entry.recipeId,
});

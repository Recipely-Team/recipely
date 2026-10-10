import type { RequestMapper } from '@core/mapper/request-mapper';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import { toMealSlotWire } from '@infrastructure/diary/write/to-meal-slot-wire';
import type { CreateMealPlanEntryRequestDto } from '@infrastructure/meal-plan/dtos/create-meal-plan-entry-request-dto';

/** `NewMealPlanEntry` → `POST /me/meal-plan/entries` body. */
export const toCreateMealPlanEntryRequest: RequestMapper<NewMealPlanEntry, CreateMealPlanEntryRequestDto> = (entry) => ({
  date: entry.date.value,
  meal: toMealSlotWire(entry.meal),
  recipeId: entry.recipeId,
  servings: entry.servings.value,
});

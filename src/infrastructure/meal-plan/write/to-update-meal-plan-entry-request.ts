import type { RequestMapper } from '@core/mapper/request-mapper';
import type { MealPlanEntryChanges } from '@domain/meal-plan/week/meal-plan-entry-changes';
import { toMealSlotWire } from '@infrastructure/diary/write/to-meal-slot-wire';
import type { UpdateMealPlanEntryRequestDto } from '@infrastructure/meal-plan/dtos/update-meal-plan-entry-request-dto';

/** `MealPlanEntryChanges` → `PATCH /me/meal-plan/entries/:id` body; unset fields are left out, not sent as null. */
export const toUpdateMealPlanEntryRequest: RequestMapper<MealPlanEntryChanges, UpdateMealPlanEntryRequestDto> = (changes) => ({
  ...(changes.date !== undefined ? { date: changes.date.value } : {}),
  ...(changes.meal !== undefined ? { meal: toMealSlotWire(changes.meal) } : {}),
  ...(changes.servings !== undefined ? { servings: changes.servings.value } : {}),
  ...(changes.position !== undefined ? { position: changes.position } : {}),
});

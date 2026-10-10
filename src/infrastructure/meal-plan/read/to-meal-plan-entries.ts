import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanDto } from '@infrastructure/meal-plan/dtos/meal-plan-dto';
import { toMealPlanEntry } from '@infrastructure/meal-plan/read/to-meal-plan-entry';

/** `GET /me/meal-plan` → its entries, in the server's order; an unreadable row is skipped rather than failing the week. */
export const toMealPlanEntries = (dto: MealPlanDto): MealPlanEntryEntity[] =>
  dto.entries.flatMap((row) => {
    const entry = toMealPlanEntry(row);
    return entry.ok ? [entry.value] : [];
  });

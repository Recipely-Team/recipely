import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { rankByName } from '@presentation/base/hooks/assistant/args/diary/rank-by-name';

/** The day's entries a spoken name (and optional meal) best points at; several means the model must ask which. */
export const matchEntries = (
  entries: readonly FoodLogEntryEntity[],
  name: string,
  meal: MealSlotType | null,
): FoodLogEntryEntity[] =>
  rankByName(
    entries.filter((entry) => meal === null || entry.meal === meal),
    (entry) => entry.name,
    name,
  );

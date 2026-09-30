import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';

/**
 * Only what the edit actually changed, or `null` when nothing did — the
 * server refuses an empty edit (`errors.validation.nothing_to_edit`), and
 * "Save" on an untouched entry should just close.
 */
export const entryChanges = (entry: FoodLogEntryEntity, servings: number, meal: MealSlotType): FoodLogEntryChanges | null => {
  const servingsChanged = servings !== entry.servings;
  const mealChanged = meal !== entry.meal;
  if (!servingsChanged && !mealChanged) return null;
  return {
    ...(servingsChanged ? { servings } : {}),
    ...(mealChanged ? { meal } : {}),
  };
};

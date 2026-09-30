import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { FoodLogEntryEntityProps } from '@domain/diary/food-log-entry-entity-props';
import { MealSlot } from '@domain/diary/meal-slot';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';

/** A valid logged entry for a test, with only the fields the test is about overridden. */
export const foodLogEntryOf = (overrides: Partial<FoodLogEntryEntityProps> = {}): FoodLogEntryEntity => {
  const created = FoodLogEntryEntity.create({
    id: 'entry-1',
    date: CalendarDate.of(2026, 9, 30),
    meal: MealSlot.Lunch,
    name: 'Menemen',
    servings: 1,
    nutrients: nutrientsOf({ calories: 300, protein: 20, carbs: 10, fat: 15 }),
    recipeId: 'recipe-1',
    recipeImageUrl: null,
    ...overrides,
  });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

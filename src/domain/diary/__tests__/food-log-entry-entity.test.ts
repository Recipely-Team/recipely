import { MealSlot } from '@domain/diary/meal-slot';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';

describe('FoodLogEntryEntity.changesTo', () => {
  const entry = foodLogEntryOf({ servings: 1, meal: MealSlot.Lunch });

  it('is null when nothing changed, so an untouched Save just closes', () => {
    expect(entry.changesTo(1, MealSlot.Lunch)).toBeNull();
  });

  it('carries only the fields that changed', () => {
    expect(entry.changesTo(1.5, MealSlot.Lunch)).toEqual({ servings: 1.5 });
    expect(entry.changesTo(1, MealSlot.Dinner)).toEqual({ meal: MealSlot.Dinner });
    expect(entry.changesTo(2, MealSlot.Snacks)).toEqual({ servings: 2, meal: MealSlot.Snacks });
  });
});

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

describe('FoodLogEntryEntity.toNew', () => {
  it('logs the same food again — what Undo after a removal sends back', () => {
    const entry = foodLogEntryOf({ servings: 1.5, meal: MealSlot.Dinner });
    const again = entry.toNew();
    expect(again).toMatchObject({ date: entry.date, meal: MealSlot.Dinner, name: entry.name, servings: 1.5, recipeId: entry.recipeId });
    expect(again.nutrients).toBe(entry.nutrients);
  });
});

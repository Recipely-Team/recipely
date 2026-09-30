import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { Servings } from '@domain/diary/entry/servings';
import { MealSlot } from '@domain/diary/meal-slot';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';

describe('LoggableFood', () => {
  it('builds an entry whose nutrients are the serving times the amount', () => {
    const food = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300, protein: 20 }), recipeId: 'r1', imageUrl: null });
    const entry = food.entryFor(CalendarDate.of(2026, 9, 30), MealSlot.Lunch, Servings.one().increment());
    expect(entry.servings).toBe(1.5);
    expect(entry.nutrients.calories).toBe(450);
    expect(entry.nutrients.protein).toBe(30);
    expect(entry.nutrients.fat).toBeNull();
  });

  it('is what an entry is per serving, for the edit sheet', () => {
    const entry = foodLogEntryOf({ servings: 2, nutrients: nutrientsOf({ calories: 600, carbs: 40 }) });
    expect(entry.food.perServing.calories).toBe(300);
    expect(entry.food.perServing.carbs).toBe(20);
  });
});

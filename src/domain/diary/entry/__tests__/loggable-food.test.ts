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

describe('LoggableFood.quickAdd', () => {
  const serving = nutrientsOf({ calories: 250 });

  it('trims the name and has no recipe behind it', () => {
    const r = LoggableFood.quickAdd('  Simit ', serving);
    expect(r.ok && r.value.name).toBe('Simit');
    expect(r.ok && r.value.isQuickAdd).toBe(true);
  });

  it('refuses a blank or over-long name, and an implausible serving, with the backend keys', () => {
    const blank = LoggableFood.quickAdd('   ', serving);
    const long = LoggableFood.quickAdd('x'.repeat(121), serving);
    const huge = LoggableFood.quickAdd('Simit', nutrientsOf({ calories: 20001 }));
    expect(!blank.ok && blank.failure.messageKey).toBe('errors.validation.food_name_required');
    expect(!long.ok && long.failure.messageKey).toBe('errors.validation.food_name_too_long');
    expect(!huge.ok && huge.failure.messageKey).toBe('errors.validation.nutrient_invalid');
    expect(LoggableFood.quickAdd('x'.repeat(120), serving).ok).toBe(true);
  });
});

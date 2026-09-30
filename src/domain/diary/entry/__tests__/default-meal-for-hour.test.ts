import { defaultMealForHour } from '@domain/diary/entry/default-meal-for-hour';
import { MealSlot } from '@domain/diary/meal-slot';

describe('defaultMealForHour', () => {
  it.each([
    [0, MealSlot.Breakfast],
    [10, MealSlot.Breakfast],
    [11, MealSlot.Lunch],
    [15, MealSlot.Lunch],
    [16, MealSlot.Dinner],
    [20, MealSlot.Dinner],
    [21, MealSlot.Snacks],
    [23, MealSlot.Snacks],
  ])('hour %i defaults to %s', (hour, meal) => {
    expect(defaultMealForHour(hour)).toBe(meal);
  });
});

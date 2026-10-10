import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { mealPlanEntryOf } from '@domain/meal-plan/__fixtures__/meal-plan-entry-of';

const day = (raw: string): CalendarDate => {
  const parsed = CalendarDate.create(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

describe('MealPlanEntryEntity', () => {
  it('derives calories from the recipe and the planned servings', () => {
    expect(mealPlanEntryOf({ servings: 2, caloriesPerServing: 400 }).calories).toBe(800);
    expect(mealPlanEntryOf({ servings: 1.5, caloriesPerServing: 333 }).calories).toBe(500);
  });

  it('has no calories while the recipe has no nutrition', () => {
    expect(mealPlanEntryOf({ caloriesPerServing: null }).calories).toBeNull();
  });

  it('refuses a position outside 0–999 and a blank id', () => {
    const entry = mealPlanEntryOf();
    const props = { id: 'x', date: entry.date, meal: MealSlot.Lunch, servings: entry.servings, eaten: false, foodLogEntryId: null, recipe: entry.recipe };
    expect(MealPlanEntryEntity.create({ ...props, position: 1000 }).ok).toBe(false);
    expect(MealPlanEntryEntity.create({ ...props, position: -1 }).ok).toBe(false);
    expect(MealPlanEntryEntity.create({ ...props, position: 0, id: ' ' }).ok).toBe(false);
  });

  it('cannot be eaten before its day, and keeps its servings once eaten', () => {
    const entry = mealPlanEntryOf({ date: '2026-10-14' });
    expect(entry.canMarkEaten(day('2026-10-13'))).toBe(false);
    expect(entry.canMarkEaten(day('2026-10-14'))).toBe(true);
    expect(entry.canChangeServings).toBe(true);
    expect(entry.withEaten(true).canChangeServings).toBe(false);
  });

  it('drops the diary link when it is un-eaten', () => {
    expect(mealPlanEntryOf({ eaten: true }).withEaten(false).foodLogEntryId).toBeNull();
  });

  it('plans the same meal afresh for an undo', () => {
    const entry = mealPlanEntryOf({ meal: MealSlot.Lunch, servings: 3 });
    expect(entry.toNew()).toEqual({ date: entry.date, meal: MealSlot.Lunch, recipeId: 'recipe-1', servings: entry.servings });
  });
});

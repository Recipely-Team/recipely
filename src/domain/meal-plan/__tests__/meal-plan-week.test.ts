import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { mealPlanEntryOf } from '@domain/meal-plan/__fixtures__/meal-plan-entry-of';

const day = (raw: string): CalendarDate => {
  const parsed = CalendarDate.create(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

// 2026-10-12 is a Monday.
describe('MealPlanWeek', () => {
  const lunch = mealPlanEntryOf({ id: 'a', date: '2026-10-13', meal: MealSlot.Lunch, servings: 1, caloriesPerServing: 500 });
  const breakfast = mealPlanEntryOf({ id: 'b', date: '2026-10-13', meal: MealSlot.Breakfast, servings: 1, caloriesPerServing: 300 });
  const nextWeek = mealPlanEntryOf({ id: 'c', date: '2026-10-19' });
  const week = MealPlanWeek.of(day('2026-10-15'), [lunch, nextWeek, breakfast]);

  it('snaps any day to its Monday and keeps only that week, in plan order', () => {
    expect(week.start.value).toBe('2026-10-12');
    expect(week.end.value).toBe('2026-10-18');
    expect(week.entries.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('adds up a day, a slot, and the average over days that have meals', () => {
    expect(week.dayCalories(day('2026-10-13'))).toBe(800);
    expect(week.slotCalories(day('2026-10-13'), MealSlot.Lunch)).toBe(500);
    expect(week.averageDailyCalories).toBe(800);
    expect(MealPlanWeek.of(day('2026-10-12'), []).averageDailyCalories).toBe(0);
  });

  it('closes the past and a full day', () => {
    expect(week.canPlanOn(day('2026-10-12'), day('2026-10-13'))).toBe(false);
    expect(week.canPlanOn(day('2026-10-13'), day('2026-10-13'))).toBe(true);
    const full = MealPlanWeek.of(
      day('2026-10-12'),
      Array.from({ length: 12 }, (_, index) => mealPlanEntryOf({ id: `f${index}`, position: index })),
    );
    expect(full.isDayFull(day('2026-10-12'))).toBe(true);
  });

  it('shows a write early with a new week, leaving the old one untouched', () => {
    const moved = week.withEntry(mealPlanEntryOf({ id: 'a', date: '2026-10-19' }));
    expect(moved.find('a')).toBeUndefined();
    expect(week.find('a')).toBeDefined();
    expect(week.without('b').mealCount).toBe(1);
  });
});

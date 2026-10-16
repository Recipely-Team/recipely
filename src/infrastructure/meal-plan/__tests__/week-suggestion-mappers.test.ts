import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { toWeekSuggestion } from '@infrastructure/meal-plan/read/to-week-suggestion';
import { toWeekSuggestionQuery } from '@infrastructure/meal-plan/write/to-week-suggestion-query';

/** "Plan my week" talks to GET /me/meal-plan/suggestion (recipely-backend #419). */
const monday = (): CalendarDate => {
  const d = CalendarDate.create('2026-10-12');
  if (!d.ok) throw new Error('date');
  return d.value;
};

describe('toWeekSuggestionQuery', () => {
  // The app's meal names are not the API's: snacks is SNACK on the wire.
  it('sends the week, the wire meal names and the seed', () => {
    expect(toWeekSuggestionQuery({ weekStart: monday(), meals: [MealSlot.Dinner, MealSlot.Snacks], seed: 7 })).toEqual({
      weekStart: '2026-10-12',
      meals: 'DINNER,SNACK',
      seed: 7,
    });
  });
});

describe('toWeekSuggestion', () => {
  it('reads the slots and drops one this build cannot read, rather than guessing', () => {
    const r = toWeekSuggestion({
      weekStart: '2026-10-12',
      poolSize: 3,
      slots: [
        { date: '2026-10-12', meal: 'DINNER', pick: { id: 'a', name: 'Menemen', imageUrl: null, caloriesPerServing: null, servings: 2, totalTimeMinutes: null }, alternative: null },
        { date: '2026-10-13', meal: 'SECOND_BREAKFAST', pick: null, alternative: null },
      ],
    });
    expect(r.ok && r.value.slots.map((s) => [s.date.value, s.meal, s.pick?.id ?? null])).toEqual([['2026-10-12', MealSlot.Dinner, 'a']]);
    expect(r.ok && r.value.poolSize).toBe(3);
  });
});

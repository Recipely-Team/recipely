import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import type { DiaryDayDto } from '@infrastructure/diary/dtos/diary-day-dto';
import type { FoodLogEntryDto } from '@infrastructure/diary/dtos/food-log-entry-dto';
import { toDiaryDay } from '@infrastructure/diary/read/to-diary-day';
import { toDiaryMonth } from '@infrastructure/diary/read/to-diary-month';
import { toFoodLogEntry } from '@infrastructure/diary/read/to-food-log-entry';
import { toLoggableFood } from '@infrastructure/diary/read/to-loggable-food';
import { toNutritionGoals } from '@infrastructure/diary/read/to-nutrition-goals';
import { toCreateFoodLogEntryRequest } from '@infrastructure/diary/write/to-create-food-log-entry-request';
import { toUpdateFoodLogEntryRequest } from '@infrastructure/diary/write/to-update-food-log-entry-request';
import { toNutritionGoalsRequest } from '@infrastructure/diary/write/to-nutrition-goals-request';
import { toRecentFoodsQuery } from '@infrastructure/diary/write/to-recent-foods-query';

const goalsDto = { calories: 2000, protein: 120, carbs: 230, fat: 65, fiber: 30, waterGlasses: 8 };

const entryDto: FoodLogEntryDto = {
  id: 'e1',
  date: '2026-09-30',
  meal: 'SNACK',
  name: 'Baklava',
  servings: 2,
  calories: 460,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  recipeId: null,
  recipeImageUrl: null,
};

const dayDto: DiaryDayDto = {
  date: '2026-09-30',
  entries: [entryDto, { ...entryDto, id: 'e2', meal: 'BREAKFAST', calories: 300, protein: 20, carbs: 10, fat: 12 }],
  waterGlasses: 5,
  totals: { calories: 760, protein: 20, carbs: 10, fat: 12, fiber: 0 },
  goals: goalsDto,
};

describe('diary read mappers', () => {
  it('maps a wire entry to the domain meal and keeps null macros null', () => {
    const r = toFoodLogEntry(entryDto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.meal).toBe(MealSlot.Snacks);
    expect(r.value.date.value).toBe('2026-09-30');
    expect(r.value.nutrients.protein).toBeNull();
    expect(r.value.nutrients.hasMacros).toBe(false);
  });

  it('refuses an unknown meal and a malformed date', () => {
    expect(toFoodLogEntry({ ...entryDto, meal: 'BRUNCH' }).ok).toBe(false);
    expect(toFoodLogEntry({ ...entryDto, date: '30.09.2026' }).ok).toBe(false);
  });

  it('maps a day and derives totals from its entries', () => {
    const r = toDiaryDay(dayDto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.totals.calories).toBe(760);
    expect(r.value.totals.protein).toBe(20);
    expect(r.value.waterGlasses).toBe(5);
    expect(r.value.entriesFor(MealSlot.Breakfast)).toHaveLength(1);
  });

  it('fails the whole day when one entry is malformed', () => {
    expect(toDiaryDay({ ...dayDto, entries: [{ ...entryDto, meal: 'BRUNCH' }] }).ok).toBe(false);
  });

  it('defaults fiber when an older backend leaves it out of the goals', () => {
    const { fiber: _omitted, ...withoutFiber } = goalsDto;
    const r = toNutritionGoals(withoutFiber);
    expect(r.ok && r.value.fiber).toBe(NutritionGoals.defaults().fiber);
  });

  it('maps a month with fiber-less day rows', () => {
    const r = toDiaryMonth({
      month: '2026-09',
      goals: goalsDto,
      days: [{ date: '2026-09-29', calories: 2269, protein: 90, carbs: 250, fat: 80, entryCount: 4 }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.month.value).toBe('2026-09');
    expect(r.value.caloriesOn(CalendarDate.of(2026, 9, 29))).toBe(2269);
    expect(r.value.days[0]?.nutrients.fiber).toBeNull();
  });

  it('reduces a recent food to one serving', () => {
    const r = toLoggableFood({ ...entryDto, servings: 2 });
    expect(r.ok && r.value.perServing.calories).toBe(230);
    expect(r.ok && r.value.isQuickAdd).toBe(true);
  });
});

describe('diary request mappers', () => {
  it('builds the create body with the wire meal, trimmed name and null macros', () => {
    expect(
      toCreateFoodLogEntryRequest({
        date: CalendarDate.of(2026, 9, 30),
        meal: MealSlot.Snacks,
        name: '  Baklava ',
        servings: 1.5,
        nutrients: nutrientsOf({ calories: 345, protein: 6 }),
        recipeId: null,
      }),
    ).toEqual({
      date: '2026-09-30',
      meal: 'SNACK',
      name: 'Baklava',
      servings: 1.5,
      calories: 345,
      protein: 6,
      carbs: null,
      fat: null,
      fiber: null,
      recipeId: null,
    });
  });

  it('sends only the changed fields of an update', () => {
    expect(toUpdateFoodLogEntryRequest({ servings: 2 })).toEqual({ servings: 2 });
    expect(toUpdateFoodLogEntryRequest({ meal: MealSlot.Dinner, date: CalendarDate.of(2026, 10, 1) })).toEqual({
      meal: 'DINNER',
      date: '2026-10-01',
    });
  });

  it('puts the requested limit in the recent query and the fiber goal in the goals body', () => {
    expect(toRecentFoodsQuery(7)).toEqual({ limit: 7 });
    expect(toNutritionGoalsRequest(NutritionGoals.defaults())).toEqual(goalsDto);
  });
});

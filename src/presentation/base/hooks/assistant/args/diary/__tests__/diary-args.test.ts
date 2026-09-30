import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { resolveDiaryDate } from '@presentation/base/hooks/assistant/args/diary/resolve-diary-date';
import { rankByName } from '@presentation/base/hooks/assistant/args/diary/rank-by-name';
import { matchEntries } from '@presentation/base/hooks/assistant/args/diary/match-entries';
import { buildFoodCandidates } from '@presentation/base/hooks/assistant/args/diary/build-food-candidates';
import { FoodSource } from '@presentation/base/hooks/assistant/args/diary/food-source';
import { parseLogFoodArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-log-food-arg';
import { parseEntryTargetArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-entry-target-arg';
import { parseGoalsArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-goals-arg';
import { parseWaterArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-water-arg';
import { parseMealArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-meal-arg';
import { recipeSummaryOf } from '@presentation/base/hooks/assistant/args/diary/__fixtures__/recipe-summary-of';

const today = CalendarDate.of(2026, 9, 30);

describe('resolveDiaryDate', () => {
  it('reads today, yesterday and an ISO day', () => {
    expect(resolveDiaryDate(' Today ', today)).toEqual({ ok: true, value: today });
    const yesterday = resolveDiaryDate('yesterday', today);
    expect(yesterday.ok && yesterday.value.value).toBe('2026-09-29');
    const iso = resolveDiaryDate('2026-09-01', today);
    expect(iso.ok && iso.value.value).toBe('2026-09-01');
  });

  it('refuses a future day and anything that is not a day', () => {
    expect(resolveDiaryDate('2026-10-01', today)).toEqual({ ok: false, error: DiaryArgError.FutureDate });
    expect(resolveDiaryDate('last monday', today)).toEqual({ ok: false, error: DiaryArgError.InvalidDate });
    expect(resolveDiaryDate('2026-02-30', today)).toEqual({ ok: false, error: DiaryArgError.InvalidDate });
  });
});

describe('parseMealArg', () => {
  it('accepts the four slots in any case, "snack" included, and absence', () => {
    expect(parseMealArg('Lunch')).toEqual({ ok: true, value: MealSlot.Lunch });
    expect(parseMealArg('snack')).toEqual({ ok: true, value: MealSlot.Snacks });
    expect(parseMealArg(undefined)).toEqual({ ok: true, value: null });
    expect(parseMealArg('brunch')).toEqual({ ok: false, error: DiaryArgError.InvalidMeal });
  });
});

describe('parseLogFoodArg', () => {
  it('takes a bare name, nothing at all, or the JSON object', () => {
    expect(parseLogFoodArg('Menemen')).toMatchObject({ ok: true, value: { name: 'Menemen', perServing: null } });
    expect(parseLogFoodArg(undefined)).toMatchObject({ ok: true, value: { name: null } });
    const full = parseLogFoodArg('{"name":"apple","meal":"snacks","servings":"2","date":"today","calories":95,"protein":0.5}');
    expect(full).toEqual({
      ok: true,
      value: { name: 'apple', meal: MealSlot.Snacks, servings: 2, date: 'today', perServing: { calories: 95, protein: 0.5, carbs: null, fat: null, fiber: null } },
    });
  });

  it('refuses broken JSON, an unknown meal and unreadable numbers', () => {
    expect(parseLogFoodArg('{"name":')).toEqual({ ok: false, error: DiaryArgError.InvalidJson });
    expect(parseLogFoodArg('{"name":"x","meal":"brunch"}')).toEqual({ ok: false, error: DiaryArgError.InvalidMeal });
    expect(parseLogFoodArg('{"name":"x","servings":"lots"}')).toEqual({ ok: false, error: DiaryArgError.InvalidServings });
  });
});

describe('parseEntryTargetArg', () => {
  it('takes a plain name or a JSON target and change', () => {
    expect(parseEntryTargetArg('menemen')).toEqual({ ok: true, value: { name: 'menemen', meal: null, servings: null, toMeal: null } });
    expect(parseEntryTargetArg('{"name":"menemen","meal":"breakfast","servings":2,"toMeal":"lunch"}')).toEqual({
      ok: true,
      value: { name: 'menemen', meal: MealSlot.Breakfast, servings: 2, toMeal: MealSlot.Lunch },
    });
  });

  it('needs a name', () => {
    expect(parseEntryTargetArg('')).toEqual({ ok: false, error: DiaryArgError.MissingName });
    expect(parseEntryTargetArg('{"meal":"lunch"}')).toEqual({ ok: false, error: DiaryArgError.MissingName });
  });
});

describe('parseGoalsArg / parseWaterArg', () => {
  it('maps water to glasses and keeps only what was sent', () => {
    expect(parseGoalsArg('{"calories":2200,"water":"10"}')).toEqual({ ok: true, value: { calories: 2200, waterGlasses: 10 } });
    expect(parseGoalsArg('{}')).toEqual({ ok: false, error: DiaryArgError.NothingToSet });
    expect(parseGoalsArg('{"fat":"much"}')).toEqual({ ok: false, error: `${DiaryArgError.InvalidNumber}:fat` });
  });

  it('reads whole glasses, negative included, and refuses zero or fractions', () => {
    expect(parseWaterArg('2')).toEqual({ ok: true, value: 2 });
    expect(parseWaterArg('-1')).toEqual({ ok: true, value: -1 });
    expect(parseWaterArg('0').ok).toBe(false);
    expect(parseWaterArg('1.5').ok).toBe(false);
  });
});

describe('name matching', () => {
  const names = ['Mercimek Çorbası', 'Menemen', 'Menemen with cheese', 'Çılbır'];

  it('prefers an exact name, then a prefix, then containing it', () => {
    expect(rankByName(names, (n) => n, 'menemen')).toEqual(['Menemen']);
    expect(rankByName(names, (n) => n, 'mercimek')).toEqual(['Mercimek Çorbası']);
    expect(rankByName(names, (n) => n, 'cheese')).toEqual(['Menemen with cheese']);
  });

  it('folds Turkish letters and accepts every word in another order', () => {
    expect(rankByName(names, (n) => n, 'cilbir')).toEqual(['Çılbır']);
    expect(rankByName(names, (n) => n, 'corbasi mercimek')).toEqual(['Mercimek Çorbası']);
    expect(rankByName(names, (n) => n, 'pilav')).toEqual([]);
  });

  it('matches the day’s entries by name within a meal, keeping ties for "which one?"', () => {
    const entries = [
      foodLogEntryOf({ id: 'a', name: 'Menemen', meal: MealSlot.Breakfast }),
      foodLogEntryOf({ id: 'b', name: 'Menemen', meal: MealSlot.Dinner }),
    ];
    expect(matchEntries(entries, 'menemen', null).map((e) => e.id)).toEqual(['a', 'b']);
    expect(matchEntries(entries, 'menemen', MealSlot.Dinner).map((e) => e.id)).toEqual(['b']);
  });

  it('offers each recipe once, only with calories, in source order, then recent foods', () => {
    const mine = recipeSummaryOf('a', 'Menemen');
    const recent = LoggableFood.of({ name: 'Apple', perServing: nutrientsOf({ calories: 95 }), recipeId: null, imageUrl: null });
    const candidates = buildFoodCandidates(
      { mine: [mine], saved: [mine, recipeSummaryOf('z', 'No kcal', 0)], feed: [recipeSummaryOf('b', 'Pilav')] },
      [recent],
    );
    expect(candidates.map((c) => [c.name, c.source])).toEqual([
      ['Menemen', FoodSource.Mine],
      ['Pilav', FoodSource.Recipely],
      ['Apple', FoodSource.Recent],
    ]);
  });
});

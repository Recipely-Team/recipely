import { NotFoundFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { MealSlot } from '@domain/diary/meal-slot';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { FoodDiaryRepository } from '@infrastructure/diary/food-diary-repository';

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}

const makeHttp = (result: Result<unknown, unknown>): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(result);
    }),
  );
  return { http, calls };
};

const goalsDto = { calories: 2000, protein: 120, carbs: 230, fat: 65, fiber: 30, waterGlasses: 8 };
const entryDto = {
  id: 'e1', date: '2026-09-30', meal: 'LUNCH', name: 'Menemen', servings: 1, calories: 300,
  protein: 20, carbs: 10, fat: 15, fiber: null, recipeId: 'r1', recipeImageUrl: 'https://cdn.test/m.jpg',
};

describe('FoodDiaryRepository', () => {
  it('GETs the requested day by its date in the path', async () => {
    const { http, calls } = makeHttp(ok({ date: '2026-09-30', entries: [entryDto], waterGlasses: 2, totals: {}, goals: goalsDto }));
    const r = await new FoodDiaryRepository(http).getDay(CalendarDate.of(2026, 9, 30));
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/diary/days/2026-09-30' });
    expect(r.ok && r.value.entries[0]?.name).toBe('Menemen');
  });

  it('GETs the requested month by its key in the path', async () => {
    const { http, calls } = makeHttp(ok({ month: '2026-08', days: [], goals: goalsDto }));
    const r = await new FoodDiaryRepository(http).getMonth(CalendarMonth.of(CalendarDate.of(2026, 8, 15)));
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/diary/months/2026-08' });
    expect(r.ok).toBe(true);
  });

  it('asks for the requested number of recent foods and skips a malformed one', async () => {
    const { http, calls } = makeHttp(ok([{ ...entryDto, calories: -5 }, entryDto]));
    const r = await new FoodDiaryRepository(http).listRecent(12);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/diary/recent', params: { limit: 12 } });
    expect(r.ok && r.value).toHaveLength(1);
  });

  it('POSTs a new entry and maps the created one back', async () => {
    const { http, calls } = makeHttp(ok(entryDto));
    const r = await new FoodDiaryRepository(http).addEntry({
      date: CalendarDate.of(2026, 9, 30), meal: MealSlot.Lunch, name: 'Menemen', servings: 1,
      nutrients: nutrientsOf({ calories: 300, protein: 20, carbs: 10, fat: 15 }), recipeId: 'r1',
    });
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/diary/entries', data: { meal: 'LUNCH', calories: 300 } });
    expect(r.ok && r.value.id).toBe('e1');
  });

  it('PATCHes, DELETEs and PUTs water against the entry and day paths', async () => {
    const { http, calls } = makeHttp(ok(entryDto));
    const repo = new FoodDiaryRepository(http);
    await repo.updateEntry('e1', { servings: 2 });
    await repo.deleteEntry('e1');
    expect(calls[0]).toMatchObject({ method: 'PATCH', url: '/diary/entries/e1', data: { servings: 2 } });
    expect(calls[1]).toMatchObject({ method: 'DELETE', url: '/diary/entries/e1' });

    const water = makeHttp(ok({ date: '2026-09-30', waterGlasses: 6 }));
    const r = await new FoodDiaryRepository(water.http).setWater(CalendarDate.of(2026, 9, 30), 6);
    expect(water.calls[0]).toMatchObject({ method: 'PUT', url: '/diary/days/2026-09-30/water', data: { glasses: 6 } });
    expect(r.ok && r.value).toBe(6);
  });

  it('reads and saves goals', async () => {
    const { http, calls } = makeHttp(ok(goalsDto));
    const repo = new FoodDiaryRepository(http);
    const read = await repo.getGoals();
    await repo.saveGoals(NutritionGoals.defaults());
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/diary/goals' });
    expect(calls[1]).toMatchObject({ method: 'PUT', url: '/diary/goals', data: goalsDto });
    expect(read.ok && read.value.equals(NutritionGoals.defaults())).toBe(true);
  });

  it('passes an HTTP failure through untouched', async () => {
    const failure = new NotFoundFailure('gone');
    const { http } = makeHttp(fail(failure));
    const r = await new FoodDiaryRepository(http).deleteEntry('e1');
    expect(!r.ok && r.failure).toBe(failure);
  });
});

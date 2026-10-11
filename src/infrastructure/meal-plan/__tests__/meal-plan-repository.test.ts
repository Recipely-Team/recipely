import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { MealPlanRepository } from '@infrastructure/meal-plan/meal-plan-repository';
import type { MealPlanDto } from '@infrastructure/meal-plan/dtos/meal-plan-dto';

interface RequestCall {
  method?: string;
  url?: string;
  params?: unknown;
  data?: unknown;
}

/** `GET /me/meal-plan` as recipely-backend #392 answers it (copied from the contract, not typed from the client). */
const WEEK_JSON = `{
  "from": "2026-10-12",
  "to": "2026-10-18",
  "entries": [
    {
      "id": "8f0f1b2a-0000-4000-8000-000000000001",
      "date": "2026-10-13",
      "meal": "LUNCH",
      "position": 0,
      "servings": 1.5,
      "eaten": true,
      "foodLogEntryId": "8f0f1b2a-0000-4000-8000-0000000000aa",
      "recipe": { "id": "r1", "name": "Mercimek çorbası", "imageUrl": null, "caloriesPerServing": 240, "servings": 4, "totalTimeMinutes": 35 }
    },
    {
      "id": "8f0f1b2a-0000-4000-8000-000000000002",
      "date": "2026-10-13",
      "meal": "NOT_A_MEAL",
      "position": 1,
      "servings": 1,
      "eaten": false,
      "foodLogEntryId": null,
      "recipe": { "id": "r2", "name": "Pilav", "imageUrl": null, "caloriesPerServing": null, "servings": 2, "totalTimeMinutes": null }
    }
  ]
}`;

const day = (raw: string): CalendarDate => {
  const parsed = CalendarDate.create(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

const answering = (answer: Result<unknown, unknown>): { repo: MealPlanRepository; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http: HttpClient = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(answer);
    }),
  );
  return { repo: new MealPlanRepository(http), calls };
};

describe('MealPlanRepository', () => {
  it('asks for the range in the query and reads the wire rows, skipping an unreadable one', async () => {
    const { repo, calls } = answering(ok(JSON.parse(WEEK_JSON) as MealPlanDto));
    const result = await repo.list(day('2026-10-12'), day('2026-10-18'));
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/me/meal-plan', params: { from: '2026-10-12', to: '2026-10-18' } });
    if (!result.ok) throw new Error('expected entries');
    expect(result.value).toHaveLength(1);
    const [entry] = result.value;
    expect(entry?.meal).toBe(MealSlot.Lunch);
    expect(entry?.servings.value).toBe(1.5);
    expect(entry?.eaten).toBe(true);
    expect(entry?.calories).toBe(360);
  });

  it('sends a new meal with the backend meal name', async () => {
    const parsed = JSON.parse(WEEK_JSON) as MealPlanDto;
    const { repo, calls } = answering(ok(parsed.entries[0]));
    const servings = Servings.create(2);
    if (!servings.ok) throw new Error('servings');
    await repo.add({ date: day('2026-10-14'), meal: MealSlot.Snacks, recipeId: 'r1', servings: servings.value });
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/me/meal-plan/entries', data: { date: '2026-10-14', meal: 'SNACK', recipeId: 'r1', servings: 2 } });
  });

  it('marks eaten with POST and un-eaten with DELETE on the same route', async () => {
    const parsed = JSON.parse(WEEK_JSON) as MealPlanDto;
    const { repo, calls } = answering(ok(parsed.entries[0]));
    await repo.setEaten('e1', true);
    await repo.setEaten('e1', false);
    expect(calls.map((call) => [call.method, call.url])).toEqual([
      ['POST', '/me/meal-plan/entries/e1/eaten'],
      ['DELETE', '/me/meal-plan/entries/e1/eaten'],
    ]);
  });
});

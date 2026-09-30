import { ServerFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { DiaryMonth } from '@domain/diary/month/diary-month';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { MealSlot } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { configureDiaryStore } from '@application/diary/diary-store';
import { DiaryConcern } from '@application/diary/diary-concern';
import { LoadDiaryDayUseCase } from '@application/diary/day/load-diary-day-use-case';
import { SetDayWaterUseCase } from '@application/diary/day/set-day-water-use-case';
import { LoadDiaryMonthUseCase } from '@application/diary/month/load-diary-month-use-case';
import { AddFoodLogEntryUseCase } from '@application/diary/entries/add-food-log-entry-use-case';
import { UpdateFoodLogEntryUseCase } from '@application/diary/entries/update-food-log-entry-use-case';
import { DeleteFoodLogEntryUseCase } from '@application/diary/entries/delete-food-log-entry-use-case';
import { LoadRecentFoodsUseCase } from '@application/diary/entries/load-recent-foods-use-case';
import { LoadNutritionGoalsUseCase } from '@application/diary/goals/load-nutrition-goals-use-case';
import { SaveNutritionGoalsUseCase } from '@application/diary/goals/save-nutrition-goals-use-case';

const today = CalendarDate.of(2026, 9, 30);
const goals = NutritionGoals.defaults();
const entry = foodLogEntryOf({ id: 'e1', date: today });
const dayOf = (entries: FoodLogEntryEntity[], waterGlasses = 2) => DiaryDay.of({ date: today, entries, waterGlasses, goals });
const monthOf = (calories: number) =>
  DiaryMonth.of({ month: CalendarMonth.of(today), goals, days: [{ date: today, nutrients: nutrientsOf({ calories }), entryCount: 1 }] });

const makeRepo = (overrides: Partial<FoodDiaryRepositoryInterface> = {}): jest.Mocked<FoodDiaryRepositoryInterface> => ({
  getDay: jest.fn().mockResolvedValue(ok(dayOf([entry]))),
  getMonth: jest.fn().mockResolvedValue(ok(monthOf(300))),
  listRecent: jest.fn().mockResolvedValue(ok([entry.food])),
  addEntry: jest.fn().mockResolvedValue(ok(entry)),
  updateEntry: jest.fn().mockResolvedValue(ok(entry)),
  deleteEntry: jest.fn().mockResolvedValue(ok(undefined)),
  setWater: jest.fn().mockImplementation((_d: CalendarDate, glasses: number) => Promise.resolve(ok(glasses))),
  getGoals: jest.fn().mockResolvedValue(ok(goals)),
  saveGoals: jest.fn().mockImplementation((g: NutritionGoals) => Promise.resolve(ok(g))),
  ...overrides,
}) as jest.Mocked<FoodDiaryRepositoryInterface>;

const makeStore = (repo: FoodDiaryRepositoryInterface) =>
  configureDiaryStore({
    loadDay: new LoadDiaryDayUseCase(repo),
    loadMonth: new LoadDiaryMonthUseCase(repo),
    loadRecent: new LoadRecentFoodsUseCase(repo),
    addEntry: new AddFoodLogEntryUseCase(repo),
    updateEntry: new UpdateFoodLogEntryUseCase(repo),
    deleteEntry: new DeleteFoodLogEntryUseCase(repo),
    setWater: new SetDayWaterUseCase(repo),
    loadGoals: new LoadNutritionGoalsUseCase(repo),
    saveGoals: new SaveNutritionGoalsUseCase(repo),
    today: () => today,
  });

const failure: Failure = new ServerFailure('boom');

/** Lets the background refreshes a write starts run to completion. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

/** A promise the test settles by hand, to hold a request in flight. */
const deferred = <T>() => {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, settle: (value: T) => settle(value) };
};

describe('diary store', () => {
  it('starts on today with default goals and nothing cached', () => {
    const s = makeStore(makeRepo()).getState();
    expect(s.selectedDate.value).toBe('2026-09-30');
    expect(s.days).toEqual({});
    expect(s.goals.equals(goals)).toBe(true);
  });

  it('caches a loaded day under its date', async () => {
    const store = makeStore(makeRepo());
    await store.getState().selectDate(today);
    expect(store.getState().days['2026-09-30']?.entries).toHaveLength(1);
    expect(store.getState().loading.day).toBe(false);
    expect(store.getState().errors.day).toBeNull();
  });

  it('records a day failure under its own concern and keeps the cache', async () => {
    const repo = makeRepo();
    const store = makeStore(repo);
    await store.getState().loadDay();
    repo.getDay.mockResolvedValueOnce(fail(failure));
    await store.getState().loadDay();
    expect(store.getState().errors.day).toBe(failure);
    expect(store.getState().errors.month).toBeNull();
    expect(store.getState().days['2026-09-30']).toBeDefined();
  });

  it('refreshes the day, its cached month and the recent list after adding', async () => {
    const repo = makeRepo();
    const store = makeStore(repo);
    await store.getState().loadMonth(CalendarMonth.of(today));
    repo.getMonth.mockResolvedValueOnce(ok(monthOf(600)));
    const r = await store.getState().addEntry(entry.food.entryFor(today, MealSlot.Lunch, Servings.one()));
    expect(r.ok).toBe(true);
    await flush();
    expect(repo.getDay).toHaveBeenCalledWith(today);
    expect(store.getState().months['2026-09']?.caloriesOn(today)).toBe(600);
    expect(store.getState().recent).toHaveLength(1);
  });

  it('refreshes both days when an update moves the entry', async () => {
    const tomorrow = today.addDays(1);
    const repo = makeRepo({ updateEntry: jest.fn().mockResolvedValue(ok(foodLogEntryOf({ id: 'e1', date: tomorrow }))) });
    await makeStore(repo).getState().updateEntry(entry, { date: tomorrow });
    expect(repo.getDay.mock.calls.map(([d]) => d.value)).toEqual(['2026-09-30', '2026-10-01']);
  });

  it('removes a deleted entry at once, and puts it back when the server refuses', async () => {
    let settle: (r: Result<void, Failure>) => void = () => undefined;
    const repo = makeRepo({ deleteEntry: jest.fn(() => new Promise<Result<void, Failure>>((resolve) => { settle = resolve; })) });
    const store = makeStore(repo);
    await store.getState().loadDay();
    const pending = store.getState().deleteEntry(entry);
    expect(store.getState().days['2026-09-30']?.entries).toHaveLength(0);
    settle(fail(failure));
    const r = await pending;
    await flush();
    expect(r.ok).toBe(false);
    expect(store.getState().errors.save).toBe(failure);
    expect(store.getState().days['2026-09-30']?.entries).toHaveLength(1);
  });

  it('sets water at once and rolls back on failure', async () => {
    const repo = makeRepo();
    const store = makeStore(repo);
    await store.getState().loadDay();
    await store.getState().setWater(today, 3);
    expect(store.getState().days['2026-09-30']?.waterGlasses).toBe(3);
    repo.setWater.mockResolvedValueOnce(fail(failure));
    const r = await store.getState().setWater(today, 4);
    expect(r.ok).toBe(false);
    expect(store.getState().days['2026-09-30']?.waterGlasses).toBe(3);
  });

  it('refuses an entry past the caps without a request', async () => {
    const repo = makeRepo();
    const huge = entry.food.entryFor(today, MealSlot.Lunch, Servings.nearest(20));
    const r = await makeStore(repo).getState().addEntry({ ...huge, nutrients: nutrientsOf({ calories: 20001 }) });
    expect(!r.ok && r.failure.messageKey).toBe('errors.validation.nutrient_invalid');
    expect(repo.addEntry).not.toHaveBeenCalled();
  });

  it('two failed water taps return to the saved count', async () => {
    const tap1 = deferred<Result<number, Failure>>();
    const tap2 = deferred<Result<number, Failure>>();
    const repo = makeRepo();
    const store = makeStore(repo);
    await store.getState().loadDay();
    repo.setWater.mockImplementationOnce(() => tap1.promise).mockImplementationOnce(() => tap2.promise);
    const first = store.getState().setWater(today, 3);
    const second = store.getState().setWater(today, 4);
    expect(store.getState().days['2026-09-30']?.waterGlasses).toBe(4);
    tap1.settle(fail(failure));
    tap2.settle(fail(failure));
    await Promise.all([first, second]);
    expect(store.getState().days['2026-09-30']?.waterGlasses).toBe(2);
  });

  it('keeps the newer tap on screen when an older one fails late, and shows what the server stored', async () => {
    const tap1 = deferred<Result<number, Failure>>();
    const tap2 = deferred<Result<number, Failure>>();
    const repo = makeRepo();
    const store = makeStore(repo);
    await store.getState().loadDay();
    repo.setWater.mockImplementationOnce(() => tap1.promise).mockImplementationOnce(() => tap2.promise);
    const first = store.getState().setWater(today, 3);
    const second = store.getState().setWater(today, 4);
    tap2.settle(ok(4));
    tap1.settle(fail(failure));
    await Promise.all([first, second]);
    expect(store.getState().days['2026-09-30']?.waterGlasses).toBe(4);
  });

  it('two failed deletes both come back, in their places', async () => {
    const e1 = foodLogEntryOf({ id: 'e1', date: today });
    const e2 = foodLogEntryOf({ id: 'e2', date: today });
    const delete1 = deferred<Result<void, Failure>>();
    const delete2 = deferred<Result<void, Failure>>();
    const repo = makeRepo({ getDay: jest.fn().mockResolvedValue(ok(dayOf([e1, e2]))) });
    const store = makeStore(repo);
    await store.getState().loadDay();
    repo.getDay.mockResolvedValue(fail(failure));
    repo.deleteEntry.mockImplementationOnce(() => delete1.promise).mockImplementationOnce(() => delete2.promise);
    const first = store.getState().deleteEntry(e1);
    const second = store.getState().deleteEntry(e2);
    expect(store.getState().days['2026-09-30']?.entries).toHaveLength(0);
    delete1.settle(fail(failure));
    delete2.settle(fail(failure));
    await Promise.all([first, second]);
    await flush();
    expect(store.getState().days['2026-09-30']?.entries.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('keeps a failed load of another day out of the selected day\'s error', async () => {
    const repo = makeRepo();
    const store = makeStore(repo);
    repo.getDay.mockResolvedValueOnce(fail(failure));
    await store.getState().loadDay(today.addDays(-3));
    expect(store.getState().errors.day).toBeNull();
    expect(store.getState().loading.day).toBe(false);
  });

  it('does not let a load that started before a goals save overwrite the saved goals', async () => {
    const slowDay = deferred<Result<DiaryDay, Failure>>();
    const repo = makeRepo();
    const store = makeStore(repo);
    repo.getDay.mockImplementationOnce(() => slowDay.promise);
    const load = store.getState().loadDay();
    const created = NutritionGoals.create({ ...goals.value, calories: 1500 });
    if (!created.ok) throw new Error('goals');
    await store.getState().saveGoals(created.value);
    slowDay.settle(ok(dayOf([entry])));
    await load;
    expect(store.getState().goals.calories).toBe(1500);
    expect(store.getState().days['2026-09-30']?.goals.calories).toBe(1500);
  });

  it('resolves an add before its refreshes finish', async () => {
    const slowDay = deferred<Result<DiaryDay, Failure>>();
    const repo = makeRepo({ getDay: jest.fn(() => slowDay.promise) });
    const r = await makeStore(repo).getState().addEntry(entry.food.entryFor(today, MealSlot.Lunch, Servings.one()));
    expect(r.ok).toBe(true);
    expect(repo.getDay).toHaveBeenCalled();
    slowDay.settle(ok(dayOf([entry])));
  });

  it('refuses water outside 0–12 without a request', async () => {
    const repo = makeRepo();
    const r = await makeStore(repo).getState().setWater(today, 13);
    expect(r.ok).toBe(false);
    expect(repo.setWater).not.toHaveBeenCalled();
  });

  it('re-derives cached days against saved goals', async () => {
    const store = makeStore(makeRepo());
    await store.getState().loadDay();
    const created = NutritionGoals.create({ ...goals.value, calories: 1000 });
    if (!created.ok) throw new Error('goals');
    await store.getState().saveGoals(created.value);
    expect(store.getState().goals.calories).toBe(1000);
    expect(store.getState().days['2026-09-30']?.remainingCalories).toBe(700);
  });

  it('drops a response that lands after clear()', async () => {
    let settle: (r: Result<DiaryDay, Failure>) => void = () => undefined;
    const repo = makeRepo({ getDay: jest.fn(() => new Promise<Result<DiaryDay, Failure>>((resolve) => { settle = resolve; })) });
    const store = makeStore(repo);
    const pending = store.getState().loadDay();
    store.getState().clear();
    settle(ok(dayOf([entry])));
    await pending;
    expect(store.getState().days).toEqual({});
  });

  it('clears one concern error on request', async () => {
    const store = makeStore(makeRepo({ getGoals: jest.fn().mockResolvedValue(fail(failure)) }));
    await store.getState().loadGoals();
    expect(store.getState().errors.goals).toBe(failure);
    store.getState().clearError(DiaryConcern.Goals);
    expect(store.getState().errors.goals).toBeNull();
  });
});

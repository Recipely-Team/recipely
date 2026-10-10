import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import { StoreStatus } from '@application/store/store-status';
import { configureMealPlanStore } from '@application/meal-plan/meal-plan-store';
import { LoadMealPlanWeekUseCase } from '@application/meal-plan/read/load-meal-plan-week-use-case';
import { BuildPlanShoppingListUseCase } from '@application/meal-plan/read/build-plan-shopping-list-use-case';
import { AddMealPlanEntryUseCase } from '@application/meal-plan/write/add-meal-plan-entry-use-case';
import { UpdateMealPlanEntryUseCase } from '@application/meal-plan/write/update-meal-plan-entry-use-case';
import { RemoveMealPlanEntryUseCase } from '@application/meal-plan/write/remove-meal-plan-entry-use-case';
import { SetMealEatenUseCase } from '@application/meal-plan/write/set-meal-eaten-use-case';
import { ClearMealPlanWeekUseCase } from '@application/meal-plan/write/clear-meal-plan-week-use-case';
import { CopyPreviousWeekUseCase } from '@application/meal-plan/write/copy-previous-week-use-case';
import { RestoreMealPlanEntriesUseCase } from '@application/meal-plan/write/restore-meal-plan-entries-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { mealPlanEntryOf } from '@domain/meal-plan/__fixtures__/meal-plan-entry-of';

const day = (raw: string): CalendarDate => {
  const parsed = CalendarDate.create(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

const repoWith = (over: Partial<MealPlanRepositoryInterface> = {}): MealPlanRepositoryInterface => ({
  list: jest.fn(async () => ok([mealPlanEntryOf({ id: 'a', date: '2026-10-13' })])),
  ingredients: jest.fn(async () => ok([])),
  add: jest.fn(async () => ok(mealPlanEntryOf())),
  update: jest.fn(async () => ok(mealPlanEntryOf())),
  remove: jest.fn(async () => ok(undefined)),
  setEaten: jest.fn(async () => ok(mealPlanEntryOf({ eaten: true }))),
  clear: jest.fn(async () => ok(undefined)),
  copyWeek: jest.fn(async () => ok({ copied: 0, skipped: 0 })),
  ...over,
});

const storeOn = (repo: MealPlanRepositoryInterface) =>
  configureMealPlanStore({
    isEnabled: async () => true,
    loadWeek: new LoadMealPlanWeekUseCase(repo),
    add: new AddMealPlanEntryUseCase(repo),
    update: new UpdateMealPlanEntryUseCase(repo),
    remove: new RemoveMealPlanEntryUseCase(repo),
    setEaten: new SetMealEatenUseCase(repo),
    clearWeek: new ClearMealPlanWeekUseCase(repo),
    copyPreviousWeek: new CopyPreviousWeekUseCase(repo),
    restore: new RestoreMealPlanEntriesUseCase(repo),
    shoppingList: new BuildPlanShoppingListUseCase(repo),
    searchRecipes: new SearchRecipeGroupUseCase({} as FoodCatalogRepositoryInterface),
  });

const loadedIds = (store: ReturnType<typeof storeOn>, key: string): string[] => {
  const state = store.getState().weeks[key];
  return state?.status === StoreStatus.Loaded ? state.week.entries.map((entry) => entry.id) : [];
};

describe('mealPlanStore', () => {
  it('loads a week under its Monday', async () => {
    const store = storeOn(repoWith());
    await store.getState().load(day('2026-10-15'));
    expect(loadedIds(store, '2026-10-12')).toEqual(['a']);
  });

  it('keeps a loaded week on screen when a refresh fails', async () => {
    const repo = repoWith();
    const store = storeOn(repo);
    await store.getState().load(day('2026-10-12'));
    jest.mocked(repo.list).mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await store.getState().load(day('2026-10-12'));
    expect(loadedIds(store, '2026-10-12')).toEqual(['a']);
  });

  it('removes a meal at once and puts it back when the server refuses', async () => {
    const repo = repoWith({ remove: jest.fn(async () => fail(new NetworkFailure('offline'))) });
    const store = storeOn(repo);
    await store.getState().load(day('2026-10-12'));
    const entry = store.getState().weeks['2026-10-12'];
    if (entry?.status !== StoreStatus.Loaded) throw new Error('not loaded');
    const pending = store.getState().remove(entry.week.entries[0]!);
    expect(loadedIds(store, '2026-10-12')).toEqual([]);
    const result = await pending;
    expect(result.ok).toBe(false);
    expect(loadedIds(store, '2026-10-12')).toEqual(['a']);
  });

  it('forgets every week on sign-out', async () => {
    const store = storeOn(repoWith());
    await store.getState().load(day('2026-10-12'));
    store.getState().clear();
    expect(store.getState().weeks).toEqual({});
  });
});

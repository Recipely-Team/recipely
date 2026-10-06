import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { MealSlot } from '@domain/diary/meal-slot';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { StoreStatus } from '@application/store/store-status';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { fakeFoodCatalogRepository, pageOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { configureFoodSearchStore } from '@application/diary/foods/food-search-store';
import { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import { LoggableProduct } from '@domain/diary/foods/loggable-product';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { StoresType } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { useAssistantDiaryActions } from '@presentation/app/diary/hooks/use-assistant-diary-actions';
import type { UseDiarySheetsResult } from '@presentation/app/diary/model/use-diary-sheets-result';

const hit = (id: string, name: string, calories: number): RecipeFoodHit =>
  RecipeFoodHit.of({ id, name, imageUrl: null, perServing: nutrientsOf({ calories, protein: 20 }), isDraft: false });
const apple = LoggableFood.of({ name: 'Apple', perServing: nutrientsOf({ calories: 95 }), recipeId: null, imageUrl: null });
const ayran = LoggableProduct.fromLogged(
  'Ayran · Az yağlı',
  { source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'glass', unitAmount: 200 },
  nutrientsOf({ calories: 52 }),
);
/** `/diary/foods/recent`: a quick-add apple and a glass and a half of ayran. */
const recentFoods: RecentFoodType[] = [
  { kind: RecentFoodKind.Food, key: 'apple', food: apple },
  { kind: RecentFoodKind.Product, key: 'ayran', product: ayran, quantity: FoodQuantity.of({ key: 'glass', amount: 200 }, 1.5) },
];
/** What the server search answers: the user's Menemen, plus whatever a test puts among everyone's recipes. */
const searchAnswer = (recipes: RecipeFoodHit[] = []): FoodSearchResults => ({
  query: 'x', saved: pageOf([]), mine: pageOf([hit('r1', 'Menemen', 300)]), products: pageOf([]), recipes: pageOf(recipes),
});

const today = CalendarDate.today();
const yesterday = today.addDays(-1);

const harness = (
  entries = [foodLogEntryOf({ id: 'e1', name: 'Menemen', date: today, meal: MealSlot.Breakfast, servings: 1 })],
  otherDays: DiaryDay[] = [],
  answer: FoodSearchResults = searchAnswer(),
) => {
  const searchFoods = { execute: jest.fn(async () => ok(answer)) };
  const listRecentFoods = { execute: jest.fn(async () => ok(pageOf(recentFoods))) };
  const repo = fakeFoodCatalogRepository();
  repo.search.mockResolvedValue(ok(answer));
  const foodSearchStore = configureFoodSearchStore({
    searchFoods: new SearchFoodsUseCase(repo),
    searchRecipeGroup: new SearchRecipeGroupUseCase(repo),
    searchProducts: new SearchProductsUseCase(repo),
  });
  const day = DiaryDay.of({ date: today, entries: entries.map((e) => e), waterGlasses: 5, goals: NutritionGoals.defaults() });
  const diaryStore = create(() => ({
    selectedDate: today,
    days: Object.fromEntries([day, ...otherDays].map((d) => [d.date.value, d])),
    goals: NutritionGoals.defaults(),
    addEntry: jest.fn(async (entry: NewFoodLogEntry) => ok(foodLogEntryOf({ name: entry.name, servings: entry.servings }))),
    deleteEntry: jest.fn(async () => ok(undefined)),
    updateEntry: jest.fn(async () => ok(foodLogEntryOf({ name: 'Menemen', servings: 2, meal: MealSlot.Lunch }))),
    setWater: jest.fn(async () => ok(undefined)),
    saveGoals: jest.fn(async (goals: NutritionGoals) => ok(goals)),
  }));
  const registry = new AssistantActionRegistry();
  const select = jest.fn();
  const sheets: UseDiarySheetsResult = {
    addRequest: null,
    goalsOpen: false,
    openAdd: jest.fn(),
    openSearch: jest.fn(),
    openEdit: jest.fn(),
    closeAdd: jest.fn(),
    openGoals: jest.fn(),
    closeGoals: jest.fn(),
  };
  const Probe = (): null => {
    useAssistantDiaryActions({ view: { status: StoreStatus.Loaded, day }, selected: today, today, select, sheets });
    return null;
  };
  renderComponent(<Probe />, { assistantActionRegistry: registry, diaryStore, searchFoods, listRecentFoods, foodSearchStore } as unknown as Partial<StoresType>);
  const run = async (action: (typeof AssistantAction)[keyof typeof AssistantAction], arg?: string): Promise<AssistantActionResultType> => {
    let result!: AssistantActionResultType;
    await act(async () => {
      result = await registry.run(action, arg);
    });
    return result;
  };
  return { registry, diaryStore, store: diaryStore.getState(), select, sheets, run, searchFoods, repo };
};

describe('useAssistantDiaryActions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('selectDate moves the day like a tap, and refuses the future', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.SelectDate, 'yesterday')).resolves.toMatchObject({ ok: true });
    expect(h.select).toHaveBeenCalledWith(yesterday);
    await expect(h.run(AssistantAction.SelectDate, today.addDays(1).value)).resolves.toMatchObject({ ok: false, error: DiaryArgError.FutureDate });
  });

  // A recipe created a minute ago is only on the server: the name is searched there, not in loaded lists.
  it('logFood logs a named recipe with its own nutrition, to the meal, amount and day asked', async () => {
    const h = harness();
    const result = await h.run(AssistantAction.LogFood, JSON.stringify({ name: 'menemen', meal: 'lunch', servings: 1.5, date: yesterday.value }));
    expect(h.searchFoods.execute).toHaveBeenCalledWith('menemen', 8);
    const entry = h.store.addEntry.mock.calls[0]?.[0];
    expect([entry?.meal, entry?.servings, entry?.date.value, entry?.nutrients.calories]).toEqual([MealSlot.Lunch, 1.5, yesterday.value, 450]);
    expect(result).toMatchObject({ ok: true });
    expect(result.title).toContain('450 kcal');
    // Logged to another day: the strip goes there so the user sees it.
    expect(h.select).toHaveBeenCalledWith(yesterday);
  });

  it('logFood uses a recent food as it is, and makes a quick add only from numbers the model sent', async () => {
    const h = harness();
    await h.run(AssistantAction.LogFood, 'apple');
    expect(h.store.addEntry.mock.calls[0]?.[0].nutrients.calories).toBe(95);

    await expect(h.run(AssistantAction.LogFood, 'simit')).resolves.toMatchObject({ ok: false, error: DiaryArgError.UnknownFood });
    await h.run(AssistantAction.LogFood, JSON.stringify({ name: 'Simit', calories: 280, carbs: 50 }));
    const quick = h.store.addEntry.mock.calls[1]?.[0];
    expect([quick?.name, quick?.recipeId, quick?.nutrients.carbs]).toEqual(['Simit', null, 50]);
  });

  // `/diary/recent` keeps a product row's totals; divided per serving it logged "Ayran, 0 kcal".
  it('logFood logs a recent product at its own unit, with that unit’s nutrients', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.LogFood, JSON.stringify({ name: 'ayran', servings: 2 }))).resolves.toMatchObject({ ok: true });
    const entry = h.store.addEntry.mock.calls[0]?.[0];
    expect([entry?.servings, entry?.product?.unitKey, entry?.nutrients.calories]).toEqual([2, 'glass', 104]);
  });

  // "bread" with the model's own estimate once logged the feed's "Banana Bread" at its calories.
  it('logFood keeps the model estimate when only a loose name match exists', async () => {
    const h = harness(undefined, [], searchAnswer([hit('r2', 'Banana Bread', 420)]));
    await expect(h.run(AssistantAction.LogFood, JSON.stringify({ name: 'bread', calories: 80 }))).resolves.toMatchObject({ ok: true });
    const entry = h.store.addEntry.mock.calls[0]?.[0];
    expect([entry?.name, entry?.recipeId, entry?.nutrients.calories]).toEqual(['bread', null, 80]);
  });

  // "Go to yesterday and remove the menemen": removeFood runs before the screen re-renders.
  it('removeFood and addWater act on the day the store has selected, not the last render', async () => {
    const yesterdayEntry = foodLogEntryOf({ id: 'y1', name: 'Menemen', date: yesterday, meal: MealSlot.Breakfast, servings: 1 });
    const other = DiaryDay.of({ date: yesterday, entries: [yesterdayEntry], waterGlasses: 1, goals: NutritionGoals.defaults() });
    const h = harness(undefined, [other]);
    h.diaryStore.setState({ selectedDate: yesterday });
    await h.run(AssistantAction.RemoveFood, 'menemen');
    expect(h.store.deleteEntry).toHaveBeenCalledWith(yesterdayEntry);
    await h.run(AssistantAction.AddWater, '1');
    expect(h.store.setWater).toHaveBeenCalledWith(yesterday, 2);
  });

  it('logFood refuses servings off the 0.5 step', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.LogFood, '{"name":"apple","servings":1.3}')).resolves.toMatchObject({ ok: false, error: DiaryArgError.InvalidServings });
    expect(h.store.addEntry).not.toHaveBeenCalled();
  });

  it('searchFood opens Add food with the query and reads the matches back', async () => {
    const h = harness();
    const result = await h.run(AssistantAction.SearchFood, 'menem');
    expect(h.sheets.openSearch).toHaveBeenCalledWith('menem');
    expect(result.title).toBe('Menemen, 300 kcal per serving, my recipe');
    // The sheet's own search for the same query joins this one: one request, not two.
    expect(h.repo.search).toHaveBeenCalledTimes(1);
  });

  it('removeFood removes the one match, and asks which when several match', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.RemoveFood, 'menemen')).resolves.toMatchObject({ ok: true });
    expect(h.store.deleteEntry).toHaveBeenCalledTimes(1);

    const two = harness([
      foodLogEntryOf({ id: 'a', name: 'Menemen', meal: MealSlot.Breakfast }),
      foodLogEntryOf({ id: 'b', name: 'Menemen', meal: MealSlot.Dinner }),
    ]);
    const result = await two.run(AssistantAction.RemoveFood, 'menemen');
    expect(result).toMatchObject({ ok: false, error: DiaryArgError.AmbiguousEntry });
    expect(result.title).toContain('dinner');
    expect(two.store.deleteEntry).not.toHaveBeenCalled();
  });

  it('changeFood sends only the change, and says when there is none', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.ChangeFood, '{"name":"menemen","servings":2,"toMeal":"lunch"}')).resolves.toMatchObject({ ok: true });
    expect(h.store.updateEntry).toHaveBeenCalledWith(expect.anything(), { servings: 2, meal: MealSlot.Lunch });
    await expect(h.run(AssistantAction.ChangeFood, '{"name":"menemen","servings":1}')).resolves.toMatchObject({ ok: false, error: DiaryArgError.NothingToChange });
  });

  it('addWater adds to the day and clamps at the daily maximum', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.AddWater, '2')).resolves.toMatchObject({ ok: true, title: `water 7/8 glasses on ${today.value}` });
    expect(h.store.setWater).toHaveBeenCalledWith(today, 7);
    await h.run(AssistantAction.AddWater, '20');
    expect(h.store.setWater).toHaveBeenLastCalledWith(today, 12);
    await expect(h.run(AssistantAction.AddWater, 'some')).resolves.toMatchObject({ ok: false });
  });

  it('setGoals merges, validates through NutritionGoals and saves', async () => {
    const h = harness();
    const result = await h.run(AssistantAction.SetGoals, '{"calories":2200,"protein":150}');
    expect(h.store.saveGoals.mock.calls[0]?.[0].value).toMatchObject({ calories: 2200, protein: 150, carbs: 230 });
    expect(result.title).toContain('2200 kcal');
    await expect(h.run(AssistantAction.SetGoals, '{"calories":100}')).resolves.toMatchObject({ ok: false, error: 'invalid_goal:calories' });
  });

  it('openGoals and openAddFood open the real sheets', async () => {
    const h = harness();
    await h.run(AssistantAction.OpenGoals);
    expect(h.sheets.openGoals).toHaveBeenCalled();
    await h.run(AssistantAction.OpenAddFood, 'dinner');
    expect(h.sheets.openAdd).toHaveBeenCalledWith(MealSlot.Dinner);
  });

  it('reads the day out with today’s date, totals, water, meals and goals', () => {
    const h = harness();
    const reading = h.registry.screenReading;
    expect(reading).toContain(`today=${today.value}`);
    expect(reading).toContain('kcal eaten=300 goal=2000 remaining=1700 status=under');
    expect(reading).toContain('water 5/8 glasses');
    expect(reading).toContain('breakfast 300 kcal: 1) Menemen, 1 serving(s), 300 kcal');
    expect(reading).toContain('goals: 2000 kcal');
  });
});

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@presentation/base/hooks/diary/use-recipe-food-sources', () => ({
  useRecipeFoodSources: () => mockSources,
}));
jest.mock('@presentation/base/hooks/diary/use-recipe-food-loader', () => ({
  useRecipeFoodLoader: () => mockLoader,
}));

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
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { recipeSummaryOf } from '@presentation/base/hooks/assistant/args/diary/__fixtures__/recipe-summary-of';
import { useAssistantDiaryActions } from '@presentation/app/diary/hooks/use-assistant-diary-actions';
import type { UseDiarySheetsResult } from '@presentation/app/diary/model/use-diary-sheets-result';

const menemenRecipe = recipeSummaryOf('r1', 'Menemen', 300);
const menemenFood = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300, protein: 20 }), recipeId: 'r1', imageUrl: null });
const apple = LoggableFood.of({ name: 'Apple', perServing: nutrientsOf({ calories: 95 }), recipeId: null, imageUrl: null });
const mockSources = { mine: [menemenRecipe], saved: [], feed: [] };
const mockLoader = { loadingId: null, open: jest.fn(async () => menemenFood) };

const today = CalendarDate.today();
const yesterday = today.addDays(-1);

const harness = (entries = [foodLogEntryOf({ id: 'e1', name: 'Menemen', date: today, meal: MealSlot.Breakfast, servings: 1 })]) => {
  const day = DiaryDay.of({ date: today, entries: entries.map((e) => e), waterGlasses: 5, goals: NutritionGoals.defaults() });
  const diaryStore = create(() => ({
    selectedDate: today,
    goals: NutritionGoals.defaults(),
    recent: [apple],
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
  renderComponent(<Probe />, { assistantActionRegistry: registry, diaryStore } as unknown as Partial<Stores>);
  const run = async (action: (typeof AssistantAction)[keyof typeof AssistantAction], arg?: string): Promise<AssistantActionResultType> => {
    let result!: AssistantActionResultType;
    await act(async () => {
      result = await registry.run(action, arg);
    });
    return result;
  };
  return { registry, store: diaryStore.getState(), select, sheets, run };
};

describe('useAssistantDiaryActions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('selectDate moves the day like a tap, and refuses the future', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.SelectDate, 'yesterday')).resolves.toMatchObject({ ok: true });
    expect(h.select).toHaveBeenCalledWith(yesterday);
    await expect(h.run(AssistantAction.SelectDate, today.addDays(1).value)).resolves.toMatchObject({ ok: false, error: DiaryArgError.FutureDate });
  });

  it('logFood logs a named recipe with its own nutrition, to the meal, amount and day asked', async () => {
    const h = harness();
    const result = await h.run(AssistantAction.LogFood, JSON.stringify({ name: 'menemen', meal: 'lunch', servings: 1.5, date: yesterday.value }));
    expect(mockLoader.open).toHaveBeenCalledWith('r1');
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
    expect(result).toMatchObject({ ok: false, error: 'ambiguous_ask_which' });
    expect(result.title).toContain('dinner');
    expect(two.store.deleteEntry).not.toHaveBeenCalled();
  });

  it('changeFood sends only the change, and says when there is none', async () => {
    const h = harness();
    await expect(h.run(AssistantAction.ChangeFood, '{"name":"menemen","servings":2,"toMeal":"lunch"}')).resolves.toMatchObject({ ok: true });
    expect(h.store.updateEntry).toHaveBeenCalledWith(expect.anything(), { servings: 2, meal: MealSlot.Lunch });
    await expect(h.run(AssistantAction.ChangeFood, '{"name":"menemen","servings":1}')).resolves.toMatchObject({ ok: false, error: 'nothing_to_change' });
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

import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { RequestEpoch } from '@application/store/request-epoch';
import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import { PageSizes } from '@application/config/page-sizes';
import type { MealPlanStoreState } from '@application/meal-plan/meal-plan-store-state';
import type { MealPlanWeekState } from '@application/meal-plan/meal-plan-week-state';
import type { LoadMealPlanWeekUseCase } from '@application/meal-plan/read/load-meal-plan-week-use-case';
import type { BuildPlanShoppingListUseCase } from '@application/meal-plan/read/build-plan-shopping-list-use-case';
import type { AddMealPlanEntryUseCase } from '@application/meal-plan/write/add-meal-plan-entry-use-case';
import type { UpdateMealPlanEntryUseCase } from '@application/meal-plan/write/update-meal-plan-entry-use-case';
import type { RemoveMealPlanEntryUseCase } from '@application/meal-plan/write/remove-meal-plan-entry-use-case';
import type { SetMealEatenUseCase } from '@application/meal-plan/write/set-meal-eaten-use-case';
import type { ClearMealPlanWeekUseCase } from '@application/meal-plan/write/clear-meal-plan-week-use-case';
import type { CopyPreviousWeekUseCase } from '@application/meal-plan/write/copy-previous-week-use-case';
import type { RestoreMealPlanEntriesUseCase } from '@application/meal-plan/write/restore-meal-plan-entries-use-case';
import type { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';

interface MealPlanStoreDeps {
  /** The `mealPlanner` flag (admin override, else build value). */
  isEnabled: () => Promise<boolean>;
  loadWeek: LoadMealPlanWeekUseCase;
  add: AddMealPlanEntryUseCase;
  update: UpdateMealPlanEntryUseCase;
  remove: RemoveMealPlanEntryUseCase;
  setEaten: SetMealEatenUseCase;
  clearWeek: ClearMealPlanWeekUseCase;
  copyPreviousWeek: CopyPreviousWeekUseCase;
  restore: RestoreMealPlanEntriesUseCase;
  shoppingList: BuildPlanShoppingListUseCase;
  searchRecipes: SearchRecipeGroupUseCase;
}

const keyOf = (day: CalendarDate): string => day.weekStart().value;

/**
 * **The weekly meal plan** (backend #392), one state per week keyed by its Monday.
 *
 * @remarks
 * - **Each week has its own epoch**: a slow answer for one week never lands on
 *   another, and a write to a week drops the load it overtook, so an older
 *   read never overwrites the meal just shown.
 * - **Servings, remove, eaten and clear are optimistic**; a refusal puts the
 *   old state back. Servings taps on one meal are ordered: only the latest
 *   tap's answer (or refusal) decides.
 * - **A failed refresh keeps a loaded week**; only a first load shows the error.
 * - **User-scoped**: cleared on sign-out (`clearSessionCaches`); an answer
 *   that lands after that is dropped. The flag answer is per launch and stays.
 */
export const configureMealPlanStore = (deps: MealPlanStoreDeps): BoundStore<MealPlanStoreState> => {
  const loads = new KeyedRequestEpoch();
  const edits = new KeyedRequestEpoch();
  const session = new RequestEpoch();
  let flag: Promise<boolean> | null = null;

  return create<MealPlanStoreState>((set, get) => {
    const put = (key: string, state: MealPlanWeekState): void => set((s) => ({ weeks: { ...s.weeks, [key]: state } }));
    const weekOf = (day: CalendarDate): MealPlanWeek | null => {
      const state = get().weeks[keyOf(day)];
      return state?.status === StoreStatus.Loaded ? state.week : null;
    };
    /** Edits a loaded week, first dropping any load of it still in flight. */
    const patch = (day: CalendarDate, edit: (week: MealPlanWeek) => MealPlanWeek): void => {
      const week = weekOf(day);
      if (week === null) return;
      loads.start(keyOf(day));
      put(keyOf(day), { status: StoreStatus.Loaded, week: edit(week) });
    };
    const recipes = new PagedListLoader<RecipeFoodHit>(() => get().recipes, (list) => set({ recipes: list }), (hit) => hit.id);

    const load = async (day: CalendarDate): Promise<void> => {
      const key = keyOf(day);
      const isCurrent = loads.start(key);
      const wasLoaded = weekOf(day) !== null;
      if (!wasLoaded) put(key, { status: StoreStatus.Loading });
      const result = await deps.loadWeek.execute(day);
      if (!isCurrent()) return;
      if (result.ok) put(key, { status: StoreStatus.Loaded, week: result.value });
      else if (!wasLoaded) put(key, { status: StoreStatus.Error, failure: result.failure });
    };

    const reloadWeeksOf = (entries: readonly MealPlanEntryEntity[]): Promise<void[]> => {
      const days = new Map(entries.map((entry) => [keyOf(entry.date), entry.date]));
      return Promise.all([...days.values()].map(load));
    };

    return {
      enabled: null,
      weekStart: CalendarDate.today().weekStart(),
      weeks: {},
      recipes: { status: StoreStatus.Idle },

      checkEnabled: async () => {
        flag ??= deps.isEnabled();
        const on = await flag;
        set({ enabled: on });
        return on;
      },
      showWeek: (day) => {
        set({ weekStart: day.weekStart() });
        void load(day);
      },
      load,

      add: async (entry, today) => {
        const isSession = session.current();
        const result = await deps.add.execute(entry, today);
        if (result.ok && isSession()) patch(result.value.date, (week) => week.withEntry(result.value));
        return result;
      },

      setServings: async (entry, servings) => {
        const isLatest = edits.start(entry.id);
        const isSession = session.current();
        patch(entry.date, (week) => week.withEntry(entry.withServings(servings)));
        const result = await deps.update.execute(entry.id, { servings });
        if (isLatest() && isSession()) patch(entry.date, (week) => week.withEntry(result.ok ? result.value : entry));
        return result;
      },

      move: async (entry, date, meal) => {
        const isSession = session.current();
        const result = await deps.update.execute(entry.id, { date, meal });
        if (!result.ok || !isSession()) return result;
        patch(entry.date, (week) => week.without(entry.id));
        patch(result.value.date, (week) => week.withEntry(result.value));
        return result;
      },

      remove: async (entry) => {
        const isSession = session.current();
        patch(entry.date, (week) => week.without(entry.id));
        const result = await deps.remove.execute(entry.id);
        if (!result.ok && isSession()) patch(entry.date, (week) => week.withEntry(entry));
        return result;
      },

      setEaten: async (entry, eaten, today) => {
        const isLatest = edits.start(entry.id);
        const isSession = session.current();
        patch(entry.date, (week) => week.withEntry(entry.withEaten(eaten)));
        const result = await deps.setEaten.execute(entry, eaten, today);
        if (isLatest() && isSession()) patch(entry.date, (week) => week.withEntry(result.ok ? result.value : entry));
        return result;
      },

      clearWeek: async (day) => {
        const isSession = session.current();
        const held = weekOf(day);
        patch(day, (week) => MealPlanWeek.of(week.start, []));
        const result = await deps.clearWeek.execute(day);
        if (!result.ok) {
          if (held !== null && isSession()) patch(day, () => held);
          return result;
        }
        return ok(held?.entries ?? []);
      },

      restore: async (entries) => {
        const result = await deps.restore.execute(entries);
        await reloadWeeksOf(entries);
        return result;
      },

      copyPreviousWeek: async (day) => {
        const result = await deps.copyPreviousWeek.execute(day);
        if (result.ok) await load(day);
        return result;
      },

      shoppingList: (day) => deps.shoppingList.execute(day),

      searchRecipes: (query, group) => recipes.load((page) => deps.searchRecipes.execute(query, group, page, PageSizes.planRecipes)),
      loadMoreRecipes: () => recipes.loadMore(),

      clear: () => {
        session.invalidate();
        loads.invalidate();
        edits.invalidate();
        recipes.reset();
        set({ weeks: {}, weekStart: CalendarDate.today().weekStart() });
      },
    };
  });
};

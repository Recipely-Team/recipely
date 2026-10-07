import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { ok } from '@core/result/result-helpers';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { DiaryConcern, type DiaryConcernType } from '@application/diary/diary-concern';
import type { DiaryStoreState } from '@application/diary/diary-store-state';
import { WaterTapLedger } from '@application/diary/day/water-tap-ledger';
import type { LoadDiaryDayUseCase } from '@application/diary/day/load-diary-day-use-case';
import type { SetDayWaterUseCase } from '@application/diary/day/set-day-water-use-case';
import type { LoadDiaryMonthUseCase } from '@application/diary/month/load-diary-month-use-case';
import type { AddFoodLogEntryUseCase } from '@application/diary/entries/add-food-log-entry-use-case';
import type { UpdateFoodLogEntryUseCase } from '@application/diary/entries/update-food-log-entry-use-case';
import type { DeleteFoodLogEntryUseCase } from '@application/diary/entries/delete-food-log-entry-use-case';
import type { LoadRecentFoodsUseCase } from '@application/diary/entries/load-recent-foods-use-case';
import type { LoadNutritionGoalsUseCase } from '@application/diary/goals/load-nutrition-goals-use-case';
import type { SaveNutritionGoalsUseCase } from '@application/diary/goals/save-nutrition-goals-use-case';

interface DiaryStoreDeps {
  loadDay: LoadDiaryDayUseCase;
  loadMonth: LoadDiaryMonthUseCase;
  loadRecent: LoadRecentFoodsUseCase;
  addEntry: AddFoodLogEntryUseCase;
  updateEntry: UpdateFoodLogEntryUseCase;
  deleteEntry: DeleteFoodLogEntryUseCase;
  setWater: SetDayWaterUseCase;
  loadGoals: LoadNutritionGoalsUseCase;
  saveGoals: SaveNutritionGoalsUseCase;
  /** Injected so tests can pin "today"; defaults to the device's local date. */
  today?: () => CalendarDate;
}

const flags = <T>(value: T): Record<DiaryConcernType, T> => ({
  [DiaryConcern.Day]: value,
  [DiaryConcern.Month]: value,
  [DiaryConcern.Recent]: value,
  [DiaryConcern.Goals]: value,
  [DiaryConcern.Save]: value,
});

/**
 * The Food Diary's state: the selected day, caches of loaded days and months,
 * the recent foods and the goals.
 *
 * @remarks
 * - **Caches, not a single "current" slot.** Paging the week strip or the
 *   calendar back to a day already seen shows it at once while it refreshes.
 * - **Optimistic where cheap, and undone precisely.** A failed delete puts back
 *   that one entry (`DiaryDay.withEntry`), never a whole-day snapshot that
 *   would also undo a concurrent delete; a failed water tap returns to the
 *   last count the server confirmed (`WaterTapLedger`), and only while it is
 *   still the latest tap.
 * - **Writes return as soon as the server answers.** The day / month / recent
 *   refreshes that follow run in the background.
 * - **Races.** The day's loading flag and error belong to the selected date
 *   only; a load that started before a goals save does not overwrite the
 *   saved goals; `clear()` bumps `session` so nothing started under a previous
 *   account publishes.
 */
export const configureDiaryStore = (deps: DiaryStoreDeps): BoundStore<DiaryStoreState> => {
  const today = deps.today ?? (() => CalendarDate.today());
  const water = new WaterTapLedger();
  let session = ValueConstants.zero;
  let goalsSaves = ValueConstants.zero;
  /** Entry ids per date in the order the server last listed them — where a failed delete goes back. */
  const serverOrder = new Map<string, readonly string[]>();

  return create<DiaryStoreState>((set, get) => {
    const mark = (concern: DiaryConcernType, loading: boolean, failure: Failure | null = null): void =>
      set((s) => ({ loading: { ...s.loading, [concern]: loading }, errors: { ...s.errors, [concern]: failure } }));

    const updateDay = (key: string, change: (day: DiaryDay) => DiaryDay): void =>
      set((s) => {
        const day = s.days[key];
        return day === undefined ? {} : { days: { ...s.days, [key]: change(day) } };
      });

    const refreshMonthOf = (date: CalendarDate): Promise<void> => {
      const month = CalendarMonth.of(date);
      return get().months[month.value] === undefined ? Promise.resolve() : get().loadMonth(month);
    };

    const refreshAround = (dates: readonly CalendarDate[]): Promise<unknown> =>
      Promise.all(dates.flatMap((date) => [get().loadDay(date), refreshMonthOf(date)]));

    return {
      selectedDate: today(),
      days: {},
      months: {},
      recent: [],
      goals: NutritionGoals.defaults(),
      loading: flags(false),
      errors: flags<Failure | null>(null),

      selectDate: async (date) => {
        set({ selectedDate: date });
        await get().loadDay(date);
      },

      loadDay: async (date) => {
        const requested = session;
        const goalsAt = goalsSaves;
        const day = date ?? get().selectedDate;
        const key = day.value;
        const isSelected = (): boolean => key === get().selectedDate.value;
        if (isSelected()) mark(DiaryConcern.Day, true);
        const result = await deps.loadDay.execute(day);
        if (requested !== session) return;
        if (!result.ok) {
          if (isSelected()) mark(DiaryConcern.Day, false, result.failure);
          return;
        }
        const fresh = goalsAt === goalsSaves;
        let loaded = fresh ? result.value : result.value.withGoals(get().goals);
        water.confirmFromLoad(key, loaded.waterGlasses);
        const cached = get().days[key];
        if (water.hasTaps(key) && cached !== undefined) loaded = loaded.withWater(cached.waterGlasses);
        serverOrder.set(key, loaded.entries.map((entry) => entry.id));
        set((s) => ({ days: { ...s.days, [key]: loaded }, ...(fresh ? { goals: loaded.goals } : {}) }));
        if (isSelected()) mark(DiaryConcern.Day, false);
      },

      loadMonth: async (month) => {
        const requested = session;
        const goalsAt = goalsSaves;
        mark(DiaryConcern.Month, true);
        const result = await deps.loadMonth.execute(month);
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Month, false, result.failure);
        const fresh = goalsAt === goalsSaves;
        const loaded = fresh ? result.value : result.value.withGoals(get().goals);
        set((s) => ({ months: { ...s.months, [month.value]: loaded }, ...(fresh ? { goals: loaded.goals } : {}) }));
        mark(DiaryConcern.Month, false);
      },

      loadRecent: async () => {
        const requested = session;
        mark(DiaryConcern.Recent, true);
        const result = await deps.loadRecent.execute();
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Recent, false, result.failure);
        set({ recent: result.value });
        mark(DiaryConcern.Recent, false);
      },

      loadGoals: async () => {
        const requested = session;
        const goalsAt = goalsSaves;
        mark(DiaryConcern.Goals, true);
        const result = await deps.loadGoals.execute();
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Goals, false, result.failure);
        if (goalsAt === goalsSaves) set({ goals: result.value });
        mark(DiaryConcern.Goals, false);
      },

      saveGoals: async (goals) => {
        const requested = session;
        goalsSaves += ValueConstants.one;
        mark(DiaryConcern.Save, true);
        const result = await deps.saveGoals.execute(goals);
        if (requested !== session) return result;
        if (!result.ok) {
          mark(DiaryConcern.Save, false, result.failure);
          return result;
        }
        const saved = result.value;
        set((s) => ({
          goals: saved,
          days: Object.fromEntries(Object.entries(s.days).map(([key, day]) => [key, day.withGoals(saved)])),
          months: Object.fromEntries(Object.entries(s.months).map(([key, month]) => [key, month.withGoals(saved)])),
        }));
        mark(DiaryConcern.Save, false);
        return result;
      },

      addEntry: async (entry) => {
        const requested = session;
        mark(DiaryConcern.Save, true);
        const result = await deps.addEntry.execute(entry);
        if (requested !== session) return result;
        mark(DiaryConcern.Save, false, result.ok ? null : result.failure);
        if (result.ok) void Promise.all([refreshAround([entry.date]), get().loadRecent()]);
        return result;
      },

      updateEntry: async (entry, changes) => {
        const requested = session;
        mark(DiaryConcern.Save, true);
        const result = await deps.updateEntry.execute(entry.id, changes);
        if (requested !== session) return result;
        mark(DiaryConcern.Save, false, result.ok ? null : result.failure);
        if (result.ok) {
          const moved = !result.value.date.equals(entry.date);
          void refreshAround(moved ? [entry.date, result.value.date] : [entry.date]);
        }
        return result;
      },

      deleteEntry: async (entry) => {
        const requested = session;
        const key = entry.date.value;
        updateDay(key, (day) => day.withoutEntry(entry.id));
        mark(DiaryConcern.Save, true);
        const result = await deps.deleteEntry.execute(entry.id);
        if (requested !== session) return result;
        mark(DiaryConcern.Save, false, result.ok ? null : result.failure);
        if (!result.ok) {
          updateDay(key, (day) => day.withEntry(entry, serverOrder.get(key)));
          return result;
        }
        void refreshMonthOf(entry.date);
        return result;
      },

      setWater: async (date, glasses) => {
        const requested = session;
        const key = date.value;
        const tap = water.begin(key);
        const cached = get().days[key];
        if (cached !== undefined && water.confirmed(key) === undefined) water.confirm(key, cached.waterGlasses);
        updateDay(key, (day) => day.withWater(glasses));
        const result = await deps.setWater.execute(date, glasses);
        if (requested !== session) return result.ok ? ok(undefined) : result;
        const latest = water.isLatest(key, tap);
        water.settle(key, tap);
        if (result.ok) {
          water.confirm(key, result.value);
          if (latest) updateDay(key, (day) => day.withWater(result.value));
          return ok(undefined);
        }
        const confirmed = water.confirmed(key);
        if (latest && confirmed !== undefined) updateDay(key, (day) => day.withWater(confirmed));
        mark(DiaryConcern.Save, false, result.failure);
        return result;
      },

      clearError: (concern) => set((s) => ({ errors: { ...s.errors, [concern]: null } })),

      clear: () => {
        session += ValueConstants.one;
        water.clear();
        serverOrder.clear();
        set({
          selectedDate: today(),
          days: {},
          months: {},
          recent: [],
          goals: NutritionGoals.defaults(),
          loading: flags(false),
          errors: flags<Failure | null>(null),
        });
      },
    };
  });
};

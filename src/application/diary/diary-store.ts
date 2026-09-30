import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { ok } from '@core/result/result-helpers';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { DIARY_RECENT_LIMIT } from '@infrastructure/constants/api/api-paging';
import { DiaryConcern, type DiaryConcernType } from '@application/diary/diary-concern';
import type { DiaryStoreState } from '@application/diary/diary-store-state';
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

const flags = <T>(value: T): Record<DiaryConcernType, T> =>
  Object.fromEntries(Object.values(DiaryConcern).map((concern) => [concern, value])) as Record<DiaryConcernType, T>;

/**
 * The Food Diary's state: the selected day, caches of loaded days and months,
 * the recent foods and the goals.
 *
 * @remarks
 * - **Caches, not a single "current" slot.** Paging the week strip or the
 *   calendar back to a day already seen shows it at once while it refreshes.
 * - **Optimistic where cheap**: water and delete change the cached day first
 *   and roll back on failure. Add and update wait for the server, then refresh
 *   the affected day(s) and any cached month, because the server owns the
 *   rescaled values and the month sums.
 * - **Session guard** — `clear()` bumps `session`; a response that started
 *   under an earlier session is dropped, so a sign-out mid-request cannot put
 *   the previous account's diary back.
 */
export const configureDiaryStore = (deps: DiaryStoreDeps): BoundStore<DiaryStoreState> => {
  const today = deps.today ?? (() => CalendarDate.today());
  let session = ValueConstants.zero;

  return create<DiaryStoreState>((set, get) => {
    const mark = (concern: DiaryConcernType, loading: boolean, failure: Failure | null = null): void =>
      set((s) => ({ loading: { ...s.loading, [concern]: loading }, errors: { ...s.errors, [concern]: failure } }));

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
        const day = date ?? get().selectedDate;
        mark(DiaryConcern.Day, true);
        const result = await deps.loadDay.execute(day);
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Day, false, result.failure);
        set((s) => ({ days: { ...s.days, [day.value]: result.value }, goals: result.value.goals }));
        mark(DiaryConcern.Day, false);
      },

      loadMonth: async (month) => {
        const requested = session;
        mark(DiaryConcern.Month, true);
        const result = await deps.loadMonth.execute(month);
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Month, false, result.failure);
        set((s) => ({ months: { ...s.months, [month.value]: result.value }, goals: result.value.goals }));
        mark(DiaryConcern.Month, false);
      },

      loadRecent: async () => {
        const requested = session;
        mark(DiaryConcern.Recent, true);
        const result = await deps.loadRecent.execute(DIARY_RECENT_LIMIT);
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Recent, false, result.failure);
        set({ recent: result.value });
        mark(DiaryConcern.Recent, false);
      },

      loadGoals: async () => {
        const requested = session;
        mark(DiaryConcern.Goals, true);
        const result = await deps.loadGoals.execute();
        if (requested !== session) return;
        if (!result.ok) return mark(DiaryConcern.Goals, false, result.failure);
        set({ goals: result.value });
        mark(DiaryConcern.Goals, false);
      },

      saveGoals: async (goals) => {
        const requested = session;
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
        if (result.ok) {
          await Promise.all([refreshAround([entry.date]), get().loadRecent()]);
        }
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
          await refreshAround(moved ? [entry.date, result.value.date] : [entry.date]);
        }
        return result;
      },

      deleteEntry: async (entry) => {
        const requested = session;
        const key = entry.date.value;
        const before = get().days[key];
        if (before !== undefined) set((s) => ({ days: { ...s.days, [key]: before.withoutEntry(entry.id) } }));
        mark(DiaryConcern.Save, true);
        const result = await deps.deleteEntry.execute(entry.id);
        if (requested !== session) return result;
        mark(DiaryConcern.Save, false, result.ok ? null : result.failure);
        if (!result.ok) {
          if (before !== undefined) set((s) => ({ days: { ...s.days, [key]: before } }));
          await get().loadDay(entry.date);
          return result;
        }
        await refreshMonthOf(entry.date);
        return result;
      },

      setWater: async (date, glasses) => {
        const requested = session;
        const key = date.value;
        const before = get().days[key];
        if (before !== undefined) set((s) => ({ days: { ...s.days, [key]: before.withWater(glasses) } }));
        const result = await deps.setWater.execute(date, glasses);
        if (requested !== session) return result.ok ? ok(undefined) : result;
        if (!result.ok) {
          // Roll back only while this tap is still the latest: a later tap owns the value now.
          const current = get().days[key];
          if (before !== undefined && current?.waterGlasses === glasses) {
            set((s) => ({ days: { ...s.days, [key]: current.withWater(before.waterGlasses) } }));
          }
          mark(DiaryConcern.Save, false, result.failure);
          return result;
        }
        return ok(undefined);
      },

      clearError: (concern) => set((s) => ({ errors: { ...s.errors, [concern]: null } })),

      clear: () => {
        session += ValueConstants.one;
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

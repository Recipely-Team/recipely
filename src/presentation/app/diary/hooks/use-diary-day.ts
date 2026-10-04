import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { DiaryConcern } from '@application/diary/diary-concern';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { canPageToNextWeek } from '@presentation/app/diary/model/week-bounds';
import { toDiaryDayView } from '@presentation/app/diary/model/to-diary-day-view';
import type { UseDiaryDayResult } from '@presentation/app/diary/model/use-diary-day-result';

const DAYS_PER_WEEK = 7;

/**
 * The Day view's model: the selected day from the store's cache, week
 * paging, pull-to-refresh and water.
 *
 * @remarks
 * - **Loads on focus, not on mount.** The tab stays mounted, and an entry
 *   logged from a recipe page must be there when the user comes back.
 * - **Past midnight** a user who was looking at "today" is moved to the new
 *   today on the next focus; a user looking at another day stays there.
 * - **A failed refresh keeps the cached day** and shows the failure as a toast.
 * - **Selecting a day is the store's `selectDate`**, which also loads it; the
 *   focus effect therefore does not depend on the selection, or every tap
 *   would load the day twice.
 */
export const useDiaryDay = (): UseDiaryDayResult => {
  const { diaryStore } = useStores();
  const selected = diaryStore((s) => s.selectedDate);
  const day = diaryStore((s) => s.days[s.selectedDate.value]);
  const failure = diaryStore((s) => s.errors.day);
  const [isRefreshing, setRefreshing] = useState(false);
  const today = CalendarDate.today();
  const hasDay = day !== undefined;
  useReportFailure(hasDay ? null : failure, 'DiaryScreen');

  // A refresh that fails over a day already on screen keeps the day and says so here, once.
  useEffect(() => {
    if (failure === null || !hasDay) return;
    showErrorToast(failure);
    diaryStore.getState().clearError(DiaryConcern.Day);
  }, [diaryStore, failure, hasDay]);

  // The "today" this screen last saw, so a tab left open overnight moves to the new today.
  const lastToday = useRef(today.value);
  useFocusEffect(
    useCallback(() => {
      const state = diaryStore.getState();
      const now = CalendarDate.today();
      const wasOnToday = state.selectedDate.value === lastToday.current;
      const dayChanged = now.value !== lastToday.current;
      lastToday.current = now.value;
      if (wasOnToday && dayChanged) void state.selectDate(now);
      else void state.loadDay();
    }, [diaryStore]),
  );

  const select = useCallback((date: CalendarDate) => void diaryStore.getState().selectDate(date), [diaryStore]);

  const page = useCallback(
    (direction: number) => {
      const now = CalendarDate.today();
      const target = diaryStore.getState().selectedDate.addDays(direction * DAYS_PER_WEEK);
      void diaryStore.getState().selectDate(target.isAfter(now) ? now : target);
    },
    [diaryStore],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    const state = diaryStore.getState();
    await Promise.all([state.loadDay(state.selectedDate), state.loadMonth(CalendarMonth.of(state.selectedDate))]);
    setRefreshing(false);
  }, [diaryStore]);

  const setWater = useCallback(
    async (glasses: number): Promise<void> => {
      const result = await diaryStore.getState().setWater(diaryStore.getState().selectedDate, glasses);
      if (!result.ok) showErrorToast(result.failure);
    },
    [diaryStore],
  );

  return {
    selected,
    today,
    view: toDiaryDayView(day, failure),
    canPageNext: canPageToNextWeek(selected, today),
    isRefreshing,
    select,
    page,
    refresh: () => void refresh(),
    retry: () => void diaryStore.getState().loadDay(),
    setWater: (glasses) => void setWater(glasses),
  };
};

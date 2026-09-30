import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * A month of the diary from the store's cache, loaded when the screen gains
 * focus and whenever the shown month changes. A cached month stays on screen
 * while it refreshes.
 *
 * @remarks
 * - **Keyed on `month.value`, not the object.** Callers build the month each
 *   render, and an object dependency would reload it on every one.
 * - `useFocusEffect` re-runs when its callback changes while focused, which
 *   is what loads a newly shown month.
 */
export const useDiaryMonth = (month: CalendarMonth): DiaryMonth | undefined => {
  const { diaryStore } = useStores();
  const key = month.value;
  const cached = diaryStore((s) => s.months[key]);
  useFocusEffect(
    useCallback(() => {
      const parsed = CalendarMonth.create(key);
      if (parsed.ok) void diaryStore.getState().loadMonth(parsed.value);
    }, [diaryStore, key]),
  );
  return cached;
};

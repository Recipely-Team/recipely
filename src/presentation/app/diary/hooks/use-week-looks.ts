import { useCallback } from 'react';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useDiaryMonth } from '@presentation/app/diary/shared/hooks/use-diary-month';
import type { DayLook } from '@presentation/app/diary/model/day-look';

/** Sunday, counted from the week's Monday. */
const LAST_WEEKDAY_OFFSET = 6;

/**
 * Each date cell's kcal and status for the selected week.
 *
 * @remarks
 * - **Month summaries for the week, the loaded day when there is one.** A
 *   week can straddle two months, so both are loaded; a day already in the
 *   cache is fresher than its month summary (it moves the moment water or an
 *   entry changes) and wins.
 */
export const useWeekLooks = (selected: CalendarDate): ((date: CalendarDate) => DayLook) => {
  const { diaryStore } = useStores();
  const days = diaryStore((s) => s.days);
  const monday = selected.weekStart();
  const first = useDiaryMonth(CalendarMonth.of(monday));
  const last = useDiaryMonth(CalendarMonth.of(monday.addDays(LAST_WEEKDAY_OFFSET)));

  return useCallback(
    (date: CalendarDate): DayLook => {
      const loaded = days[date.value];
      if (loaded !== undefined) return { calories: loaded.totals.calories, status: loaded.calorieStatus };
      const month = [first, last].find((candidate) => candidate?.month.contains(date) === true);
      return {
        calories: month?.caloriesOn(date) ?? ValueConstants.zero,
        status: month?.statusFor(date) ?? CalorieStatus.None,
      };
    },
    [days, first, last],
  );
};

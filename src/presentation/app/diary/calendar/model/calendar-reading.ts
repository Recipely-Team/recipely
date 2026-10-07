import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import { CharConstants, ValueConstants } from '@core/constants';
import { datePart } from '@presentation/app/diary/model/assistant/date-part';
import { formatMonthYear } from '@presentation/app/diary/shared/model/format-month-year';

/**
 * The month page read out for `readScreen` (docs/diary-assistant-contract.md):
 * today, the shown and selected month, each logged day's kcal and status, and
 * the month's stats.
 */
export const calendarReading = (
  month: CalendarMonth,
  diaryMonth: DiaryMonth | undefined,
  selected: CalendarDate,
  today: CalendarDate,
  locale: string,
): string => {
  const head = [
    'screen=diaryCalendar',
    datePart('today', today, locale),
    datePart('selected', selected, locale),
    `month=${month.value} (${formatMonthYear(month, locale)})`,
  ];
  if (diaryMonth === undefined) return [...head, 'month: loading'].join(CharConstants.newline);
  const logged = month.days().filter((date) => diaryMonth.isLogged(date));
  const stats = diaryMonth.stats(today);
  return [
    ...head,
    logged.length === ValueConstants.zero
      ? 'logged days: none'
      : `logged days: ${logged.map((date) => `${date.value} ${Math.round(diaryMonth.caloriesOn(date))} kcal ${diaryMonth.statusFor(date)}`).join(', ')}`,
    `stats: daily average ${stats.dailyAverage === null ? 'none yet' : `${Math.round(stats.dailyAverage)} kcal`}, days on target ${stats.daysOnTarget}/${stats.daysLogged}, streak ${stats.streak} days`,
  ].join(CharConstants.newline);
};

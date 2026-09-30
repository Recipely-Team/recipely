import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';

/** "September 2026" / "Eylül 2026" — the month card's title. */
export const formatMonthYear = (month: CalendarMonth, locale: string): string =>
  month.firstDay.toLocalDate().toLocaleDateString(locale, { month: 'long', year: 'numeric' });

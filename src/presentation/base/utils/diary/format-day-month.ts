import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** "30 September" / "30 Eylül" — a diary day without its weekday or year. */
export const formatDayMonth = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { day: 'numeric', month: 'long' });

import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** "Wed" / "Çar" — a date cell's weekday line. */
export const formatWeekdayShort = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { weekday: 'short' });

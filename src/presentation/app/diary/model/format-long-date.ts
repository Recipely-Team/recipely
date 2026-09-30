import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** "Wednesday, 30 September" — the date strip's heading, in the reader's locale. */
export const formatLongDate = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

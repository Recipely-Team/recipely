import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** A day heading in the Plan my week proposal: "Mon, Oct 5" in the reader's language. */
export const formatPlanDay = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

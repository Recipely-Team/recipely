import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** "Thu, Oct 1" / "1 Eki Per" — a planned day in toasts and sheet captions, in the reader's locale. */
export const formatPlanDay = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

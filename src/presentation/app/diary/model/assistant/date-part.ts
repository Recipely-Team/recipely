import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { formatLongDate } from '@presentation/app/diary/model/format-long-date';

/** "today=2026-09-30 (Wednesday, 30 September)" — the model has no clock, so every reading carries it. */
export const datePart = (label: string, date: CalendarDate, locale: string): string =>
  `${label}=${date.value} (${formatLongDate(date, locale)})`;

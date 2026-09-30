import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';

/**
 * The month grid's cells, Monday first: `null` blanks before the 1st, then
 * every day. The blanks are a layout concern the domain leaves to the screen
 * (`CalendarMonth.days()` is the month's dates only).
 */
export const monthGridCells = (month: CalendarMonth): (CalendarDate | null)[] => [
  ...Array.from({ length: month.firstDay.weekday }, () => null),
  ...month.days(),
];

import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

/** Whether "next week" is allowed: never past the week holding today (design spec → Food Diary §4). */
export const canPageToNextWeek = (shownDay: CalendarDate, today: CalendarDate): boolean =>
  shownDay.weekStart().isBefore(today.weekStart());

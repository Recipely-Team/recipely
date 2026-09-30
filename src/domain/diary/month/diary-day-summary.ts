import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';

/** One day of a month summary. `nutrients.fiber` is always null — the month endpoint omits it. */
export interface DiaryDaySummary {
  readonly date: CalendarDate;
  readonly nutrients: Nutrients;
  readonly entryCount: number;
}

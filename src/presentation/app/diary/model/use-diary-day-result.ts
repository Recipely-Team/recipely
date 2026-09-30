import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { DiaryDayView } from '@presentation/app/diary/model/diary-day-view';

/** The Day view's state and intents, as `useDiaryDay` exposes them. */
export interface UseDiaryDayResult {
  selected: CalendarDate;
  today: CalendarDate;
  view: DiaryDayView;
  canPageNext: boolean;
  isRefreshing: boolean;
  select: (date: CalendarDate) => void;
  /** −1 / +1 week; a week that would land past today lands on today. */
  page: (direction: number) => void;
  refresh: () => void;
  retry: () => void;
  setWater: (glasses: number) => void;
}

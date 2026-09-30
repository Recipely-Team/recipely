import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { StoreStatus } from '@application/store/store-status';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import type { DiaryDayView } from '@presentation/app/diary/model/diary-day-view';

/** The Day view's one-line state, riding on every tool result: counts, never contents. */
export const diaryScreenLine = (view: DiaryDayView, selected: CalendarDate, today: CalendarDate): string => {
  const parts = [`today=${today.value}`, `selected=${selected.value}`];
  if (view.status !== StoreStatus.Loaded) return [...parts, `day=${view.status}`].join(SCREEN_PART_SEPARATOR);
  const { day } = view;
  return [
    ...parts,
    `kcal=${Math.round(day.totals.calories)}/${day.goals.calories}`,
    `status=${day.calorieStatus}`,
    `entries=${day.entries.length}`,
    `water=${day.waterGlasses}/${day.goals.waterGlasses}`,
  ].join(SCREEN_PART_SEPARATOR);
};

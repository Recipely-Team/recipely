import { CharConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

const TRAILING_DOT = /\.$/;

/** "Thu" / "Per" — a planner day's weekday, without the trailing dot some locales (Turkish) put on the short form. */
export const formatPlanWeekday = (date: CalendarDate, locale: string): string =>
  date.toLocalDate().toLocaleDateString(locale, { weekday: 'short' }).replace(TRAILING_DOT, CharConstants.empty);

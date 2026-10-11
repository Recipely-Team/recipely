import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import { ValueConstants } from '@core/constants';

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
const LAST_DAY = MealPlanLimits.daysPerWeek - ValueConstants.one;

/** "Sep 28 – Oct 4" / "28 Eyl – 4 Eki" — a week, Monday to Sunday, in the reader's locale. */
export const formatWeekRange = (weekStart: CalendarDate, locale: string): string =>
  `${weekStart.toLocalDate().toLocaleDateString(locale, DAY_MONTH)} – ${weekStart.addDays(LAST_DAY).toLocalDate().toLocaleDateString(locale, DAY_MONTH)}`;

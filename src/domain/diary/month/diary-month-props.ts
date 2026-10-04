import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { DiaryDaySummary } from '@domain/diary/month/diary-day-summary';

export interface DiaryMonthProps {
  readonly month: CalendarMonth;
  readonly days: readonly DiaryDaySummary[];
  readonly goals: NutritionGoals;
}

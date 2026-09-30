import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { CalorieStatus, type CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { DiaryDaySummary } from '@domain/diary/month/diary-day-summary';
import type { DiaryMonthProps } from '@domain/diary/month/diary-month-props';
import type { DiaryMonthStats } from '@domain/diary/month/diary-month-stats';

/**
 * A month of the diary as the calendar reads it: per-day kcal against the
 * goals, and the stats tiles.
 *
 * @remarks
 * - **A day is "logged" when it has at least one entry** — water alone does
 *   not count.
 * - **The streak stops at the month's first day.** Only this month's days are
 *   loaded, so a streak that began last month reads short on the 1st–nth.
 * - Stats take `today` as a parameter so they are testable and so a month in
 *   the past counts every day.
 */
export class DiaryMonth {
  private readonly byDate: ReadonlyMap<string, DiaryDaySummary>;

  private constructor(private readonly props: DiaryMonthProps) {
    this.byDate = new Map(props.days.map((day) => [day.date.value, day]));
  }

  static of(props: DiaryMonthProps): DiaryMonth {
    return new DiaryMonth(props);
  }

  get month(): CalendarMonth {
    return this.props.month;
  }

  get days(): readonly DiaryDaySummary[] {
    return this.props.days;
  }

  get goals(): NutritionGoals {
    return this.props.goals;
  }

  summaryFor(date: CalendarDate): DiaryDaySummary | null {
    return this.byDate.get(date.value) ?? null;
  }

  isLogged(date: CalendarDate): boolean {
    return (this.summaryFor(date)?.entryCount ?? ValueConstants.zero) > ValueConstants.zero;
  }

  caloriesOn(date: CalendarDate): number {
    return this.summaryFor(date)?.nutrients.calories ?? ValueConstants.zero;
  }

  statusFor(date: CalendarDate): CalorieStatusType {
    return this.props.goals.calorieStatus(this.caloriesOn(date), this.isLogged(date));
  }

  stats(today: CalendarDate): DiaryMonthStats {
    const past = this.props.days.filter((day) => day.date.isBefore(today) && this.isLogged(day.date));
    const totalKcal = past.reduce((sum, day) => sum + day.nutrients.calories, ValueConstants.zero);
    return {
      dailyAverage: past.length === ValueConstants.zero ? null : totalKcal / past.length,
      daysOnTarget: past.filter((day) => this.statusFor(day.date) === CalorieStatus.On).length,
      daysLogged: past.length,
      streak: this.streakEndingAt(today),
    };
  }

  withGoals(goals: NutritionGoals): DiaryMonth {
    return new DiaryMonth({ ...this.props, goals });
  }

  private streakEndingAt(today: CalendarDate): number {
    let cursor = this.isLogged(today) ? today : today.addDays(ValueConstants.minusOne);
    let streak = ValueConstants.zero;
    while (this.props.month.contains(cursor) && this.isLogged(cursor)) {
      streak += ValueConstants.one;
      cursor = cursor.addDays(ValueConstants.minusOne);
    }
    return streak;
  }
}

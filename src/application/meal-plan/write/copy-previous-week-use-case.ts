import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CopyMealPlanResult } from '@domain/meal-plan/week/copy-meal-plan-result';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** Copies the week before `day`'s into the same weekdays; the server skips days that have passed or are full. */
export class CopyPreviousWeekUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(day: CalendarDate): Promise<Result<CopyMealPlanResult, Failure>> {
    const start = day.weekStart();
    return this.repo.copyWeek(start.addDays(-MealPlanLimits.daysPerWeek), start);
  }
}

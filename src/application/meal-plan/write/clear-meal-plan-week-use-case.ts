import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** Removes every planned meal of `day`'s week; meals already logged stay in the diary. */
export class ClearMealPlanWeekUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(day: CalendarDate): Promise<Result<void, Failure>> {
    const week = MealPlanWeek.of(day, []);
    return this.repo.clear(week.start, week.end);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** The Monday-to-Sunday week holding `day`, in one `GET /me/meal-plan`. */
export class LoadMealPlanWeekUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  async execute(day: CalendarDate): Promise<Result<MealPlanWeek, Failure>> {
    const empty = MealPlanWeek.of(day, []);
    const result = await this.repo.list(empty.start, empty.end);
    return result.ok ? ok(MealPlanWeek.of(day, result.value)) : result;
  }
}

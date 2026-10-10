import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** Plans a meal; a day that has passed is refused here, a full day by the server (409 `meal_plan_day_full`). */
export class AddMealPlanEntryUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(entry: NewMealPlanEntry, today: CalendarDate): Promise<Result<MealPlanEntryEntity, Failure>> {
    if (entry.date.isBefore(today)) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.mealPlan.pastDay, 'date', ErrorMessageKey.mealPlanEntryInvalid)));
    }
    return this.repo.add(entry);
  }
}

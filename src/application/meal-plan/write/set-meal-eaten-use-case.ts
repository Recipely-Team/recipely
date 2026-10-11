import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/**
 * Marks a planned meal eaten — the server logs it to the diary (recipe, same
 * meal, the planned servings) — or takes that back. A meal still ahead
 * cannot be eaten yet (`MealPlanEntryEntity.canMarkEaten`).
 */
export class SetMealEatenUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(entry: MealPlanEntryEntity, eaten: boolean, today: CalendarDate): Promise<Result<MealPlanEntryEntity, Failure>> {
    if (eaten && !entry.canMarkEaten(today)) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.mealPlan.notYetEaten, 'date', ErrorMessageKey.mealPlanEntryInvalid)));
    }
    return this.repo.setEaten(entry.id, eaten);
  }
}

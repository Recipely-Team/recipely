import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanEntryChanges } from '@domain/meal-plan/week/meal-plan-entry-changes';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** Changes a planned meal's servings, or moves it to another day or meal (the end of that slot). */
export class UpdateMealPlanEntryUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(id: string, changes: MealPlanEntryChanges): Promise<Result<MealPlanEntryEntity, Failure>> {
    return this.repo.update(id, changes);
  }
}

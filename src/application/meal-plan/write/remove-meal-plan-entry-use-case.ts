import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';

/** Takes a meal off the plan; a diary entry it already logged stays in the diary. */
export class RemoveMealPlanEntryUseCase {
  constructor(private readonly repo: MealPlanRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.remove(id);
  }
}

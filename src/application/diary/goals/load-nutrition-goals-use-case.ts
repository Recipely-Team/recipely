import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Loads the user's daily goals — the defaults when they never saved any. */
export class LoadNutritionGoalsUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(): Promise<Result<NutritionGoals, Failure>> {
    return this.repo.getGoals();
  }
}

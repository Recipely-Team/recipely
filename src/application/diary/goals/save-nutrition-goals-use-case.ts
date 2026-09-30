import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Saves the user's daily goals; they apply to every day, past ones included. */
export class SaveNutritionGoalsUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(goals: NutritionGoals): Promise<Result<NutritionGoals, Failure>> {
    return this.repo.saveGoals(goals);
  }
}

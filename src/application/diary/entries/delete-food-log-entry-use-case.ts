import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Removes a logged entry. */
export class DeleteFoodLogEntryUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.deleteEntry(id);
  }
}

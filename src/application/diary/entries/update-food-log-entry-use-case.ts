import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Moves a logged entry to another meal or day, or changes its servings (the server rescales). */
export class UpdateFoodLogEntryUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(id: string, changes: FoodLogEntryChanges): Promise<Result<FoodLogEntryEntity, Failure>> {
    return this.repo.updateEntry(id, changes);
  }
}

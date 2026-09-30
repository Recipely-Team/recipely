import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Logs a food on a day, in a meal. */
export class AddFoodLogEntryUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(entry: NewFoodLogEntry): Promise<Result<FoodLogEntryEntity, Failure>> {
    return this.repo.addEntry(entry);
  }
}

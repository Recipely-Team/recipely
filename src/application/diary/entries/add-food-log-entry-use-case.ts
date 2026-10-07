import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/**
 * Logs a food on a day, in a meal. An amount past the entry caps (a quick add
 * multiplied up by the stepper) is refused here with the server's own key,
 * before a request is spent on it.
 */
export class AddFoodLogEntryUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(entry: NewFoodLogEntry): Promise<Result<FoodLogEntryEntity, Failure>> {
    const capped = entry.nutrients.requireWithinEntryCaps();
    return capped.ok ? this.repo.addEntry(entry) : Promise.resolve(capped);
  }
}

import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
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
    if (!entry.nutrients.isWithinEntryCaps) {
      return Promise.resolve(
        fail(new ValidationFailure(DiagnosticMessage.diary.nutrientTooHigh('calories'), 'calories', ErrorMessageKey.diaryNutrientInvalid)),
      );
    }
    return this.repo.addEntry(entry);
  }
}

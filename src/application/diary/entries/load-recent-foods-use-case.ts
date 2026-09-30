import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Loads the foods the user logged before, most recent first, one serving each. */
export class LoadRecentFoodsUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(limit: number): Promise<Result<LoggableFood[], Failure>> {
    return this.repo.listRecent(limit);
  }
}

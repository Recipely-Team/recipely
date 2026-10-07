import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';

/** Loads the foods the user logged before, most recent first, one serving each — as many as the Recent tab shows. */
export class LoadRecentFoodsUseCase {
  constructor(private readonly repo: FoodDiaryRepositoryInterface) {}

  execute(): Promise<Result<LoggableFood[], Failure>> {
    return this.repo.listRecent(DiaryLimits.RecentFoods);
  }
}

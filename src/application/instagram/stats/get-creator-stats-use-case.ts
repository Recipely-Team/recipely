import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** The creator stats panel for one range. */
export class GetCreatorStatsUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(days: StatsRangeType): Promise<Result<CreatorStats, Failure>> {
    return this.repo.getStats(days);
  }
}

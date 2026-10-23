import type { StoreStatus } from '@application/store/store-status';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';

export interface CreatorStatsLoaded {
  status: typeof StoreStatus.Loaded;
  stats: CreatorStats;
}

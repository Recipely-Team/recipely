import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';

/** One range of the creator stats panel. */
export type CreatorStatsState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; stats: CreatorStats }
  | { status: typeof StoreStatus.Error; failure: Failure };

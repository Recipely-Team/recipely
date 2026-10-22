import type { CreatorStatsIdle } from '@application/instagram/stats/states/creator-stats-idle';
import type { CreatorStatsLoading } from '@application/instagram/stats/states/creator-stats-loading';
import type { CreatorStatsLoaded } from '@application/instagram/stats/states/creator-stats-loaded';
import type { CreatorStatsError } from '@application/instagram/stats/states/creator-stats-error';

/** One range of the creator stats panel. */
export type CreatorStatsState =
  | CreatorStatsIdle
  | CreatorStatsLoading
  | CreatorStatsLoaded
  | CreatorStatsError;

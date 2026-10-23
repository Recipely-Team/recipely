import type { ProfileStatsIdle } from '@presentation/app/profile/model/states/profile-stats-idle';
import type { ProfileStatsLoading } from '@presentation/app/profile/model/states/profile-stats-loading';
import type { ProfileStatsError } from '@presentation/app/profile/model/states/profile-stats-error';
import type { ProfileStatsLoaded } from '@presentation/app/profile/model/states/profile-stats-loaded';

/**
 * Discriminated union describing the profile stats row: still loading, failed
 * (with a retry handler), loaded (carrying the raw counts the row formats), or
 * idle (nothing to show yet).
 */
export type ProfileStatsState =
  | ProfileStatsIdle
  | ProfileStatsLoading
  | ProfileStatsError
  | ProfileStatsLoaded;

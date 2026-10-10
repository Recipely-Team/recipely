import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { CreatorStatsState } from '@application/instagram/stats/creator-stats-state';

export interface CreatorStatsStoreState {
  /** The range the stats screen shows. */
  range: StatsRangeType;
  /** Each range's answer, kept apart so the profile's 30-day line survives a switch to 7. */
  byRange: Partial<Record<StatsRangeType, CreatorStatsState>>;
  /** Shows `days` and loads it. */
  setRange: (days: StatsRangeType) => void;
  /** Loads one range; a loaded range stays on screen while it refreshes. */
  load: (days: StatsRangeType) => Promise<void>;
  /** Drops everything. Called when the session ends. */
  clear: () => void;
}

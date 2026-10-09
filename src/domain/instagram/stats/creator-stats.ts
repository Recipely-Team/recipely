import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { FunnelCounts } from '@domain/instagram/stats/funnel-counts';
import type { FunnelDay } from '@domain/instagram/stats/funnel-day';
import type { FollowerTrend } from '@domain/instagram/stats/follower-trend';
import type { StatsPost } from '@domain/instagram/stats/stats-post';

/**
 * **The creator stats panel** for one range (backend #390): what the
 * creator's comment-to-DM automations brought in, counted by Recipely.
 *
 * @remarks
 * - `previous` is the same number of days just before `from`, for the deltas.
 * - `daily` holds every day of the range, zeros included, oldest first.
 * - `posts` lists every automation, the quiet ones too, ordered by opens.
 */
export interface CreatorStats {
  readonly days: StatsRangeType;
  /** `YYYY-MM-DD`, inclusive. */
  readonly from: string;
  readonly connected: boolean;
  readonly totals: FunnelCounts;
  readonly previous: FunnelCounts;
  readonly daily: readonly FunnelDay[];
  readonly followers: FollowerTrend;
  readonly posts: readonly StatsPost[];
}

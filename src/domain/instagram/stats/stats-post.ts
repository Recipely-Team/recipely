import type { FunnelCounts } from '@domain/instagram/stats/funnel-counts';

/** One automated post's row: its rule, the post's look, and how its DMs did in the range. */
export interface StatsPost extends FunnelCounts {
  readonly ruleId: string;
  readonly mediaId: string;
  readonly thumbnailUrl: string | null;
  readonly keywords: readonly string[];
  readonly enabled: boolean;
}

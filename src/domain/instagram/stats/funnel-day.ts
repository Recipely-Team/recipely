import type { FunnelCounts } from '@domain/instagram/stats/funnel-counts';

/** One UTC day of the range, by the day the DMs went out. */
export interface FunnelDay extends FunnelCounts {
  /** `YYYY-MM-DD`. */
  readonly day: string;
}

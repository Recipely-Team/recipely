import type { FollowerPoint } from '@domain/instagram/stats/follower-point';

/**
 * The follower trend over a range. Instagram keeps no history of the count, so
 * it starts the day Recipely took its first snapshot (`trackingSince`).
 */
export interface FollowerTrend {
  /** The latest snapshot in the range; null before the first one. */
  readonly current: number | null;
  /** Latest minus the range's first snapshot; null with fewer than two. */
  readonly change: number | null;
  /** `YYYY-MM-DD` of the first snapshot ever; null before it. */
  readonly trackingSince: string | null;
  readonly points: readonly FollowerPoint[];
}

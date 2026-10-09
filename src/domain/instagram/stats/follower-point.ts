/** The creator's Instagram follower count on one UTC day, from Recipely's own snapshot. */
export interface FollowerPoint {
  /** `YYYY-MM-DD`. */
  readonly day: string;
  readonly followers: number;
}

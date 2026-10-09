/** The ranges the creator stats panel offers, in days. Also the wire values. */
export const StatsRange = {
  Week: 7,
  Month: 30,
  Quarter: 90,
} as const;

export type StatsRangeType = (typeof StatsRange)[keyof typeof StatsRange];

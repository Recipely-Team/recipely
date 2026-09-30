/**
 * The separate things the diary store loads or writes, each with its own
 * loading flag and error — so a failed month load does not blank the day, and
 * a failed save does not read as a failed load.
 */
export const DiaryConcern = {
  Day: 'day',
  Month: 'month',
  Recent: 'recent',
  Goals: 'goals',
  /** Any write: add, update, delete, water, goals. */
  Save: 'save',
} as const;

export type DiaryConcernType = (typeof DiaryConcern)[keyof typeof DiaryConcern];

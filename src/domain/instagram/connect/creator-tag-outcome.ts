/**
 * What linking did to the Instagram creator tag: approved on the spot, refused
 * because another Recipely account holds the handle, or refused as invalid.
 * Also the wire values.
 */
export const CreatorTagOutcome = {
  Approved: 'approved',
  Taken: 'taken',
  Invalid: 'invalid',
} as const;

export type CreatorTagOutcomeType = (typeof CreatorTagOutcome)[keyof typeof CreatorTagOutcome];

/**
 * What one row of the Edit Profile creator card is (design spec §7, rev 2):
 * a platform with a claim, a platform without one, or the link form open on one.
 */
export const CreatorAccountRowKind = {
  Linked: 'linked',
  Add: 'add',
  Form: 'form',
} as const;

export type CreatorAccountRowKindType = (typeof CreatorAccountRowKind)[keyof typeof CreatorAccountRowKind];

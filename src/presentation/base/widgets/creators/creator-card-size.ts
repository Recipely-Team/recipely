/**
 * The two creator cards the prototype draws: the phone's two-column grid
 * (72 avatar) and the expanded viewport's six-column grid (80 avatar).
 */
export const CreatorCardSize = {
  Compact: 'compact',
  Wide: 'wide',
} as const;

export type CreatorCardSizeType = (typeof CreatorCardSize)[keyof typeof CreatorCardSize];

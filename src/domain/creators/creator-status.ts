/**
 * Where a user's creator claim stands. Mirrors `recipely-backend`'s
 * `CreatorStatus` (docs/creator-tag-contract.md).
 *
 * @remarks
 * - **`None` never travels.** The wire sends `creator: null` for it; a
 *   `CreatorClaim` only ever holds one of the other three.
 * - **Only `Approved` shows a tag.** A pending or rejected claim is visible to
 *   its owner alone, on Edit Profile.
 */
export const CreatorStatus = {
  None: 'none',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type CreatorStatus = (typeof CreatorStatus)[keyof typeof CreatorStatus];

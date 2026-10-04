/**
 * Where one platform's creator claim stands. Mirrors `recipely-backend`'s
 * claim status (docs/creator-tag-contract.md).
 *
 * @remarks
 * - **There is no "none".** A platform without a claim has no entry in
 *   `CreatorClaims`; a `CreatorClaim` always holds one of these three.
 * - **Only `Approved` shows a tag.** A pending or rejected claim is visible to
 *   its owner alone, on Edit Profile.
 */
export const CreatorStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type CreatorStatus = (typeof CreatorStatus)[keyof typeof CreatorStatus];

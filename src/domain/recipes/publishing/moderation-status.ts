/**
 * Where a recipe stands with the moderator, as the backend reports it.
 *
 * @remarks
 * - **`unreviewed` is the private state.** A recipe saved and never offered for
 *   publishing has not been looked at, and that is the normal case now that
 *   every save is private.
 * - **`rejected` is final.** The backend refuses to take a rejected recipe
 *   back into review, so nothing in the app offers it.
 */
export const ModerationStatus = {
  Unreviewed: 'unreviewed',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

export type ModerationStatusType = (typeof ModerationStatus)[keyof typeof ModerationStatus];

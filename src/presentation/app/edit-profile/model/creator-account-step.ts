/**
 * Which face the Edit Profile creator section shows — the prototype's four
 * boards: no claim (the form), in review, approved, refused.
 */
export const CreatorAccountStep = {
  Form: 'form',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

export type CreatorAccountStepType = (typeof CreatorAccountStep)[keyof typeof CreatorAccountStep];

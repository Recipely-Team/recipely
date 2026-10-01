import type { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';

/** The faces of a claim that has been sent — every step but the form. */
export type CreatorClaimStepType =
  | typeof CreatorAccountStep.Pending
  | typeof CreatorAccountStep.Approved
  | typeof CreatorAccountStep.Rejected;

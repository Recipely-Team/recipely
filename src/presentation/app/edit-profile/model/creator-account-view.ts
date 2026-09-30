import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';

/** What the creator section renders, one shape per step. */
export type CreatorAccountView =
  | {
      step: typeof CreatorAccountStep.Form;
      platform: CreatorPlatformType;
      handle: string;
      /** The refusal's copy, under the field; null when there is none. */
      error: string | null;
      /** True when a claim exists and the form is editing it — offers Cancel. */
      canCancel: boolean;
    }
  | { step: typeof CreatorAccountStep.Pending; tag: CreatorTag }
  | { step: typeof CreatorAccountStep.Approved; tag: CreatorTag }
  | { step: typeof CreatorAccountStep.Rejected; tag: CreatorTag };

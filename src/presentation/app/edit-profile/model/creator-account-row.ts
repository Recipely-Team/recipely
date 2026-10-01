import type { CreatorClaim } from '@domain/creators/creator-claim';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorAccountRowKind } from '@presentation/app/edit-profile/model/creator-account-row-kind';

/** One row of the creator card, by kind. */
export type CreatorAccountRow =
  | { kind: typeof CreatorAccountRowKind.Linked; claim: CreatorClaim }
  | { kind: typeof CreatorAccountRowKind.Add; platform: CreatorPlatformType }
  | {
      kind: typeof CreatorAccountRowKind.Form;
      platform: CreatorPlatformType;
      handle: string;
      /** The refusal's copy, under the field; null when there is none. */
      error: string | null;
    };

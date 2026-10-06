import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorAccountRowType } from '@presentation/app/edit-profile/model/creator-account-row';

/** View model returned by {@link useCreatorAccount} for the Edit Profile creator section. */
export interface UseCreatorAccountResult {
  /** Linked platforms first, then the ones to link, Instagram first in each. */
  rows: readonly CreatorAccountRowType[];
  /** A request, withdrawal or removal is on its way; every action waits. */
  isBusy: boolean;
  /** Opens the link form on `platform` (a Link row, or Try again on a rejected one); one form at a time. */
  onOpenForm: (platform: CreatorPlatformType) => void;
  onChangeHandle: (value: string) => void;
  /** Sends the open form's handle for review, normalised. */
  onSubmit: () => void;
  onCancel: () => void;
  /** Withdraws a pending claim or unlinks an approved one, on that platform only. */
  onRemove: (platform: CreatorPlatformType) => void;
}

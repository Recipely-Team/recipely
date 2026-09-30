import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorAccountView } from '@presentation/app/edit-profile/model/creator-account-view';

/** View model returned by {@link useCreatorAccount} for the Edit Profile creator section. */
export interface UseCreatorAccountResult {
  view: CreatorAccountView;
  /** A request, withdrawal or removal is on its way; every action waits. */
  isBusy: boolean;
  onPickPlatform: (platform: CreatorPlatformType) => void;
  onChangeHandle: (value: string) => void;
  /** Sends the claim for review, the handle normalised. */
  onSubmit: () => void;
  /** Opens the form on the current claim (Change, Edit and resend). */
  onEdit: () => void;
  onCancelEdit: () => void;
  /** Withdraws a pending claim or removes an approved one. */
  onRemove: () => void;
}

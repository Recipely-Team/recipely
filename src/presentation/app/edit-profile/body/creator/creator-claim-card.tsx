import type { CreatorTag } from '@domain/creators/creator-tag';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, lineHeights } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PillButton } from '@presentation/base/widgets/buttons/pill-button';
import { PillButtonTone } from '@presentation/base/widgets/buttons/pill-button-tone';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { t } from '@presentation/i18n';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';
import type { CreatorClaimStepType } from '@presentation/app/edit-profile/model/creator-claim-step-type';
import { CreatorClaimStatus } from '@presentation/app/edit-profile/items/creator-claim-status';
import { CreatorHandleChip } from '@presentation/app/edit-profile/items/creator-handle-chip';

export interface CreatorClaimCardProps {
  step: CreatorClaimStepType;
  tag: CreatorTag;
  isBusy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * A claim that has been sent: its state, what review said, the account, and
 * the one thing the user can do about it (design spec → Creators §7) —
 * withdraw while in review, unlink once approved, try again once rejected
 * (the form, prefilled).
 *
 * @remarks
 * - **Approved shows the verified badge**, linked to the account; in review
 *   and rejected the neutral chip, since nothing is verified.
 */
export const CreatorClaimCard = ({ step, tag, isBusy, onEdit, onRemove }: CreatorClaimCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creators.account;
  const body =
    step === CreatorAccountStep.Pending
      ? copy.pendingBody
      : step === CreatorAccountStep.Approved
        ? copy.approvedBody
        : copy.rejectedBody.replace('{handle}', tag.displayHandle);

  return (
    <>
      <CreatorClaimStatus step={step} />
      <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.text}>
        {body}
      </SizedText>
      {step === CreatorAccountStep.Approved ? <CreatorTagChip tag={tag} /> : <CreatorHandleChip tag={tag} />}
      {step === CreatorAccountStep.Pending ? (
        <PillButton label={copy.withdraw} tone={PillButtonTone.Ghost} onPress={onRemove} loading={isBusy} />
      ) : null}
      {step === CreatorAccountStep.Approved ? (
        <PillButton label={copy.remove} tone={PillButtonTone.Ghost} onPress={onRemove} loading={isBusy} />
      ) : null}
      {step === CreatorAccountStep.Rejected ? <PillButton label={copy.resubmit} onPress={onEdit} disabled={isBusy} /> : null}
    </>
  );
};

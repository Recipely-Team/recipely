import { StyleSheet, View } from 'react-native';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PillButton } from '@presentation/base/widgets/buttons/pill-button';
import { PillButtonTone } from '@presentation/base/widgets/buttons/pill-button-tone';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { t } from '@presentation/i18n';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';

export interface CreatorClaimCardProps {
  step: typeof CreatorAccountStep.Pending | typeof CreatorAccountStep.Approved | typeof CreatorAccountStep.Rejected;
  tag: CreatorTag;
  isBusy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * A claim that has been sent: the account, what review said, and what the
 * user can do about it — withdraw while in review, change or remove once
 * approved, edit and resend once refused.
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
      {step !== CreatorAccountStep.Rejected ? (
        <View style={styles.account}>
          <CreatorPlatformMark platform={tag.platform} size={creatorMarkGeometry.row} />
          <SizedText size={fontSizes.body} weight={fontWeights.semibold}>
            {tag.displayHandle}
          </SizedText>
        </View>
      ) : null}
      <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.textSubtle}>
        {body}
      </SizedText>
      {step === CreatorAccountStep.Pending ? (
        <PillButton label={copy.withdraw} tone={PillButtonTone.Danger} onPress={onRemove} loading={isBusy} />
      ) : null}
      {step === CreatorAccountStep.Approved ? (
        <View style={styles.pair}>
          <View style={styles.half}>
            <PillButton label={copy.change} tone={PillButtonTone.Outline} onPress={onEdit} disabled={isBusy} />
          </View>
          <View style={styles.half}>
            <PillButton label={copy.remove} tone={PillButtonTone.Danger} onPress={onRemove} loading={isBusy} />
          </View>
        </View>
      ) : null}
      {step === CreatorAccountStep.Rejected ? <PillButton label={copy.resubmit} onPress={onEdit} disabled={isBusy} /> : null}
    </>
  );
};

const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: ValueConstants.one,
  },
});

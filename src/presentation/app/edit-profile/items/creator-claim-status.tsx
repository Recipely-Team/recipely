import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorBadge } from '@presentation/base/widgets/creators/creator-badge';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { t } from '@presentation/i18n';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';
import type { CreatorClaimStepType } from '@presentation/app/edit-profile/model/creator-claim-step-type';

export interface CreatorClaimStatusProps {
  step: CreatorClaimStepType;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * A sent claim's head: a 40 round tile with the state's icon, and its title —
 * "In review" (hourglass, `primary`), "Approved" (check, `success`, with the
 * approved badge), "Rejected" (alert, `danger`). The status colours are icon
 * ink only, never text (design spec → Creators §1, §7).
 */
export const CreatorClaimStatus = ({ step }: CreatorClaimStatusProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creators.account;
  const look: Record<CreatorClaimStepType, { icon: IconName; ink: string; title: string }> = {
    [CreatorAccountStep.Pending]: { icon: 'hourglass-outline', ink: colors.primary, title: copy.pending },
    [CreatorAccountStep.Approved]: { icon: 'checkmark-circle', ink: colors.success, title: copy.approved },
    [CreatorAccountStep.Rejected]: { icon: 'alert-circle', ink: colors.danger, title: copy.rejected },
  };
  const { icon, ink, title } = look[step];

  return (
    <View style={styles.row}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.tile, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
      >
        <Ionicons name={icon} size={iconSizes.xl} color={ink} />
      </View>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} accessibilityRole="header" style={styles.title}>
        {title}
      </SizedText>
      {step === CreatorAccountStep.Approved ? <CreatorBadge size={creatorMarkGeometry.badgeStatus} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tile: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: controlSizes.floatingBtn / ValueConstants.two,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: ValueConstants.one,
  },
});

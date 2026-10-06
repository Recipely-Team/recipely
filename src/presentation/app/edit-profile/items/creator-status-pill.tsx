import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CreatorStatus } from '@domain/creators/creator-status';
import type { CreatorClaim } from '@domain/creators/creator-claim';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';

export interface CreatorStatusPillProps {
  claim: CreatorClaim;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Where one platform's claim stands, 24 high (design spec §7, rev 2): in review
 * and rejected on the page `background` with a hairline and an hourglass /
 * alert in `primary` / `danger` (icon ink only); approved on `primary`.
 */
export const CreatorStatusPill = ({ claim }: CreatorStatusPillProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creators.account;
  const approved = claim.status === CreatorStatus.Approved;
  const look: { icon: IconName; ink: string; label: string } = approved
    ? { icon: 'checkmark', ink: colors.primaryText, label: copy.approved }
    : claim.status === CreatorStatus.Rejected
      ? { icon: 'alert-circle', ink: colors.danger, label: copy.rejected }
      : { icon: 'hourglass-outline', ink: colors.primary, label: copy.pending };

  return (
    <View
      style={[
        styles.pill,
        approved
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.background, borderColor: colors.cardBorder },
      ]}
    >
      <Ionicons name={look.icon} size={iconSizes.sm} color={look.ink} />
      <SizedText size={fontSizes.small} weight={fontWeights.bold} color={approved ? colors.primaryText : colors.text}>
        {look.label}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.checkbox,
    paddingLeft: spacing.xs2,
    paddingRight: spacing.sm2,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});

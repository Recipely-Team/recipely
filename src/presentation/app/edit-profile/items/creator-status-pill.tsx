import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { CreatorAccountStep, type CreatorAccountStepType } from '@presentation/app/edit-profile/model/creator-account-step';

export interface CreatorStatusPillProps {
  step: Exclude<CreatorAccountStepType, typeof CreatorAccountStep.Form>;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Each review state as the prototype colours it: amber in review, green approved, red refused. */
const LOOK: Record<CreatorStatusPillProps['step'], { severity: SeverityType; icon: IconName; label: () => string }> = {
  [CreatorAccountStep.Pending]: { severity: SeverityType.Warning, icon: 'time-outline', label: () => t().creators.account.pending },
  [CreatorAccountStep.Approved]: { severity: SeverityType.Success, icon: 'checkmark', label: () => t().creators.account.approved },
  [CreatorAccountStep.Rejected]: { severity: SeverityType.Danger, icon: 'close', label: () => t().creators.account.rejected },
};

/**
 * Where the claim stands, as a small pill. The colours are the severity
 * surfaces — the app's warning / success / danger — whose label text reads at
 * AA on its own fill in every palette (creator-contrast.test.ts).
 */
export const CreatorStatusPill = ({ step }: CreatorStatusPillProps): React.JSX.Element => {
  const look = LOOK[step];
  const surface = useSeveritySurfaces()[look.severity];
  return (
    <View style={[styles.pill, { backgroundColor: surface.bg }]}>
      <Ionicons name={look.icon} size={iconSizes.xs} color={surface.text} />
      <SizedText size={fontSizes.small} weight={fontWeights.bold} color={surface.text}>
        {look.label()}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.round,
  },
});

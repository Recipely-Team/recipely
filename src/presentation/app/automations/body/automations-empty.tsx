import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AutomationsEmptyProps {
  disabled: boolean;
  onCreate: () => void;
}

/** No automations yet (spec §2 → Empty): a send disc, the title, three numbered steps and Create. */
export const AutomationsEmpty = ({ disabled, onCreate }: AutomationsEmptyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().instagram;
  const steps = [copy.emptyStep1, copy.emptyStep2, copy.emptyStep3];
  return (
    <View style={styles.box}>
      <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="paper-plane" size={iconSizes.xxl} color={colors.chipText} />
      </View>
      <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy} style={styles.center}>
        {copy.emptyTitle}
      </SizedText>
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, { backgroundColor: colors.chipBackground }]}>
              <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText}>
                {String(index + ValueConstants.one)}
              </SizedText>
            </View>
            <SizedText size={fontSizes.medium} style={styles.stepText}>
              {step}
            </SizedText>
          </View>
        ))}
      </View>
      <View style={styles.cta}>
        <PrimaryButton label={copy.emptyCta} onPress={onCreate} disabled={disabled} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  disc: { width: AutomationMetrics.emptyDisc, height: AutomationMetrics.emptyDisc, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  steps: { alignSelf: 'stretch', gap: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: AutomationMetrics.stepDot, height: AutomationMetrics.stepDot, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: ValueConstants.one },
  cta: { alignSelf: 'center', width: '100%', maxWidth: AutomationMetrics.emptyCtaMaxWidth },
});

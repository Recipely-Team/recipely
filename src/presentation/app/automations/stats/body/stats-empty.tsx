import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { borderWidths, fontSizes, fontWeights, iconSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface StatsEmptyProps {
  onCreate: () => void;
}

/** No automations yet (spec state 2): what will appear here, and the way to make the first one. */
export const StatsEmpty = ({ onCreate }: StatsEmptyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creatorStats;
  return (
    <View style={styles.centre}>
      <View style={[styles.disc, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Ionicons name="bar-chart-outline" size={iconSizes.xl} color={colors.primary} />
      </View>
      <SizedText size={fontSizes.subtitle} weight={fontWeights.heavy} accessibilityRole="header" style={styles.text}>
        {copy.emptyTitle}
      </SizedText>
      <SizedText size={fontSizes.medium} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.text}>
        {copy.emptyBody}
      </SizedText>
      <View style={styles.cta}>
        <PrimaryButton label={copy.emptyCta} onPress={onCreate} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centre: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  disc: { width: AutomationMetrics.emptyDisc, height: AutomationMetrics.emptyDisc, borderRadius: radii.round, borderWidth: borderWidths.hairline, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  cta: { width: '100%', maxWidth: AutomationMetrics.emptyCtaMaxWidth, marginTop: spacing.sm },
});

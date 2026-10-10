import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface NoSendsCardProps {
  days: StatsRangeType;
  /** The next longer range; null on the longest. */
  nextRange: StatsRangeType | null;
  onRange: (days: StatsRangeType) => void;
  onViewAutomations: () => void;
}

/** No DMs in the range (spec state 3): say so, offer a longer range and the automations. */
export const NoSendsCard = ({ days, nextRange, onRange, onViewAutomations }: NoSendsCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creatorStats;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={[styles.disc, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={iconSizes.xl} color={colors.primary} />
      </View>
      <SizedText size={fontSizes.subtitle} weight={fontWeights.heavy} accessibilityRole="header" style={styles.text}>
        {copy.noSendsTitle.replace('{n}', String(days))}
      </SizedText>
      <SizedText size={fontSizes.medium} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.text}>
        {copy.noSendsBody}
      </SizedText>
      <View style={styles.actions}>
        {nextRange !== null ? <PrimaryButton label={copy.showDays.replace('{n}', String(nextRange))} onPress={() => onRange(nextRange)} /> : null}
        <Pressable onPress={onViewAutomations} accessibilityRole="button" style={[styles.ghost, { borderColor: colors.cardBorder }]}>
          <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
            {copy.viewAutomations}
          </SizedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  disc: { width: AutomationMetrics.emptyDisc, height: AutomationMetrics.emptyDisc, borderRadius: radii.round, borderWidth: borderWidths.hairline, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  actions: { width: '100%', maxWidth: AutomationMetrics.emptyCtaMaxWidth, gap: spacing.sm },
  ghost: { minHeight: controlSizes.button, borderRadius: radii.round, borderWidth: borderWidths.thin, alignItems: 'center', justifyContent: 'center' },
});

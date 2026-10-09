import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { RoutePaths } from '@presentation/base/constants';
import { useCreatorStatsLine } from '@presentation/app/profile/hooks/use-creator-stats-line';
import { borderWidths, fontSizes, fontWeights, iconSizes, opacities, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * The automations card's second row (creator stats spec "Entry points"):
 * Creator stats with the last 30 days in a line. Mounted only under a linked
 * account; draws nothing until there is at least one automation.
 */
export const CreatorStatsRow = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const router = useRouter();
  const line = useCreatorStatsLine();
  if (line === null) return null;
  return (
    <>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Pressable
        onPress={() => router.push(RoutePaths.automationStats)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressed : opacities.full }]}
      >
        <Ionicons name="bar-chart-outline" size={iconSizes.md} color={colors.primary} style={styles.mark} />
        <View style={styles.text}>
          <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
            {t().creatorStats.profileTitle}
          </SizedText>
          <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
            {line}
          </SizedText>
        </View>
        <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  divider: { height: borderWidths.hairline },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: AutomationMetrics.recipeRow - spacing.xs, paddingHorizontal: spacing.lg },
  mark: { width: AutomationMetrics.connectMark, textAlign: 'center' },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
});

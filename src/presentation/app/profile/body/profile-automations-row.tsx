import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useInstagramConnection } from '@presentation/base/hooks/instagram/use-instagram-connection';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { RoutePaths } from '@presentation/base/constants';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { borderWidths, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CreatorStatsRow } from '@presentation/app/profile/body/creator-stats-row';

/**
 * Profile's way into Instagram automations (spec §2 → Entry): shown only
 * while an Instagram account is linked through Instagram's login; "Paused"
 * in danger once the link expired. A second row opens Creator stats once
 * there is at least one automation (creator stats spec "Entry points").
 */
export const ProfileAutomationsRow = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const router = useRouter();
  const connection = useInstagramConnection();
  if (!connection.isAvailable || !connection.isConnected) return null;
  const copy = t().instagram;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <Pressable
        onPress={() => router.push(RoutePaths.automations)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressed : opacities.full }]}
      >
        <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={AutomationMetrics.connectMark} />
        <View style={styles.text}>
          <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
            {copy.profileEntry}
          </SizedText>
          <SizedText size={fontSizes.small} color={connection.isExpired ? colors.danger : colors.textSubtle} numberOfLines={ValueConstants.one}>
            {connection.isExpired ? copy.profileEntryPaused : copy.automationsSub}
          </SizedText>
        </View>
        <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
      </Pressable>
      <CreatorStatsRow />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: AutomationMetrics.recipeRow - spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
});

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';
import { StoreStatus } from '@application/store/store-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, letterSpacings, borderWidths, opacities } from '@presentation/base/theme';
import { getLocale, t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import type { ProfileStatsState } from '@presentation/app/profile/model/profile-stats-state';
import { ValueConstants } from '@core/constants';
import { formatCompactCount } from '@presentation/base/utils/format-compact-count';

const STAT_VALUE_SIZE = fontSizes.subtitle;
const STAT_VALUE_LINE = lineHeightFor(STAT_VALUE_SIZE, lineHeights.tight);
const STAT_LABEL_SIZE = fontSizes.tiny;
const STAT_LABEL_TRACKING = letterSpacings.wide;

export interface ProfileStatsProps {
  stats: ProfileStatsState;
}

/**
 * Renders the recipes / likes / views / saved row with loading + error branches.
 * "Recipes" and "Saved" open those My Recipes tabs — they read as links, so
 * they are; likes and views have nowhere to go and stay plain.
 */
export const ProfileStats = ({ stats }: ProfileStatsProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const router = useRouter();

  if (stats.status === StoreStatus.Loading) {
    return (
      <View style={styles.statsLoading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (stats.status === StoreStatus.Error) {
    return (
      <Pressable
        onPress={stats.onRetry}
        style={[
          styles.statsError,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t().common.retry}
      >
        <ThemedText variant="caption" muted style={styles.statsErrorText}>
          {stats.message}
        </ThemedText>
        <ThemedText variant="caption" style={[styles.retryText, { color: colors.primary }]}>
          {t().common.retry}
        </ThemedText>
      </Pressable>
    );
  }

  if (stats.status === StoreStatus.Loaded) {
    const openTab = (tab: string) => (): void => router.push(RoutePaths.myRecipesTab(tab) as Href);
    const cells = [
      { value: String(stats.recipeCount), label: t().profile.recipes, onPress: openTab(RoutePaths.myRecipesCreatedTab) },
      { value: formatCompactCount(stats.totalLikes, getLocale()), label: t().profile.likes, onPress: null },
      { value: formatCompactCount(stats.totalViews, getLocale()), label: t().profile.views, onPress: null },
      { value: String(stats.savedCount), label: t().profile.saved, onPress: openTab(RoutePaths.myRecipesSavedTab) },
    ];

    return (
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        {cells.map((stat, idx, arr) => (
          <Pressable
            key={stat.label}
            onPress={stat.onPress ?? undefined}
            disabled={stat.onPress === null}
            accessibilityRole={stat.onPress === null ? 'text' : 'link'}
            accessibilityLabel={`${stat.value} ${stat.label}`}
            style={({ pressed }) => [
              styles.statCell,
              idx < arr.length - ValueConstants.one
                ? [styles.statDivider, { borderRightColor: colors.border }]
                : null,
              { opacity: pressed ? opacities.pressedSubtle : opacities.full },
            ]}
          >
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText variant="caption" muted style={[styles.statLabel, stat.onPress === null ? null : { color: colors.primary }]}>
              {upperCase(stat.label)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  statsLoading: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statsError: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    gap: spacing.xs,
    alignItems: 'center',
  },
  statsErrorText: {
    textAlign: 'center',
  },
  retryText: {
    fontWeight: fontWeights.bold,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.md,
  },
  statCell: {
    flex: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    borderRightWidth: ValueConstants.one,
  },
  statValue: {
    fontWeight: fontWeights.heavy,
    fontSize: STAT_VALUE_SIZE,
    lineHeight: STAT_VALUE_LINE,
  },
  statLabel: {
    fontSize: STAT_LABEL_SIZE,
    fontWeight: fontWeights.semibold,
    letterSpacing: STAT_LABEL_TRACKING,
  },
});

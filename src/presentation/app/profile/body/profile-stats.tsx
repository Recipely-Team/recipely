import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, letterSpacings, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import type { ProfileStatsState } from '@presentation/app/profile/model/profile-stats-state';
import { ValueConstants } from '@core/constants';

const STAT_VALUE_SIZE = fontSizes.subtitle;
const STAT_VALUE_LINE = lineHeightFor(STAT_VALUE_SIZE, lineHeights.tight);
const STAT_LABEL_SIZE = fontSizes.tiny;
const STAT_LABEL_TRACKING = letterSpacings.wide;

/** Compact-notation display formatter for large stat counts (1.2K, 3.4M). */
const formatStat = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export interface ProfileStatsProps {
  stats: ProfileStatsState;
}

/** Renders the recipes / likes / views / saved row with loading + error branches. */
export const ProfileStats = ({ stats }: ProfileStatsProps): React.JSX.Element | null => {
  const colors = useTheme().colors;

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
    const cells = [
      { value: String(stats.recipeCount), label: t().profile.recipes },
      { value: formatStat(stats.totalLikes), label: t().profile.likes },
      { value: formatStat(stats.totalViews), label: t().profile.views },
      { value: String(stats.savedCount), label: t().profile.saved },
    ];

    return (
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        {cells.map((stat, idx, arr) => (
          <View
            key={stat.label}
            style={[
              styles.statCell,
              idx < arr.length - ValueConstants.one
                ? [styles.statDivider, { borderRightColor: colors.border }]
                : null,
            ]}
          >
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText variant="caption" muted style={styles.statLabel}>
              {upperCase(stat.label)}
            </ThemedText>
          </View>
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

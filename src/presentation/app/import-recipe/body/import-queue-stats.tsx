import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ImportQueueStatsProps {
  isWeb: boolean;
  host: string;
}

/**
 * The wait, in numbers: how long, and — for a web page — which site.
 *
 * The site takes the wider card because a host name is longer than "~5 sec",
 * and it wraps rather than truncating: a clipped host hides the part that
 * tells two sites apart.
 */
export const ImportQueueStats = ({ isWeb, host }: ImportQueueStatsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }];

  if (!isWeb) {
    return (
      <View style={[card, styles.estimateRow]}>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {copy.estimate}
        </ThemedText>
        <ThemedText variant="subtitle">{copy.estimateValue}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[card, styles.site]}>
        <ThemedText variant="caption" style={[styles.key, { color: colors.textMuted }]}>
          {copy.webSite}
        </ThemedText>
        <ThemedText variant="subtitle">{host}</ThemedText>
      </View>
      <View style={[card, styles.estimate]}>
        <ThemedText variant="caption" style={[styles.key, { color: colors.textMuted }]}>
          {copy.estimate}
        </ThemedText>
        <ThemedText variant="subtitle">{copy.webEstimateValue}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  site: {
    flex: ValueConstants.two,
    minWidth: ValueConstants.zero,
  },
  estimate: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  key: {
    fontWeight: fontWeights.semibold,
  },
});

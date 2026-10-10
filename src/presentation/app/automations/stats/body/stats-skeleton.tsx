import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { borderWidths, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

const FUNNEL_CELLS = 4;
const LIST_ROWS = 3;
const LINE = 12;
const VALUE = 24;

/** Loading (spec state 1): the shape of every block, so nothing jumps when the numbers land. */
export const StatsSkeleton = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const card = [styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }];
  return (
    <View style={styles.stack} accessible accessibilityLabel={t().creatorStats.loading} accessibilityState={{ busy: true }}>
      <View style={[...card, styles.funnel]}>
        {Array.from({ length: FUNNEL_CELLS }, (_, i) => (
          <View key={`f-${i}`} style={styles.cell}>
            <SkeletonLoader width="60%" height={LINE} />
            <SkeletonLoader width="40%" height={VALUE} />
            <SkeletonLoader width="70%" height={LINE} />
          </View>
        ))}
      </View>
      <View style={card}>
        <SkeletonLoader width="100%" height={StatsMetrics.chartHeight} borderRadius={radii.md} />
      </View>
      <View style={card}>
        <SkeletonLoader width="100%" height={StatsMetrics.sparkHeight} borderRadius={radii.md} />
      </View>
      <View style={card}>
        {Array.from({ length: LIST_ROWS }, (_, i) => (
          <View key={`r-${i}`} style={styles.row}>
            <SkeletonLoader width={StatsMetrics.postThumb} height={StatsMetrics.postThumb} borderRadius={radii.md} />
            <View style={styles.rowText}>
              <SkeletonLoader width="50%" height={LINE} />
              <SkeletonLoader width="80%" height={LINE} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.xl },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  funnel: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '50%', flexGrow: ValueConstants.one, gap: spacing.sm, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  rowText: { flex: ValueConstants.one, gap: spacing.sm },
});

import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { colorAlphas, fontSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** Above the daily chart: a square for the Sent bars, short strokes for the Opened and Saved lines. */
export const ChartLegend = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creatorStats;
  const items = [
    { key: 'sent', label: copy.legendSent, swatch: [styles.square, { backgroundColor: colors.textMuted + colorAlphas.medium }] },
    { key: 'opened', label: copy.legendOpened, swatch: [styles.line, { backgroundColor: colors.primary }] },
    { key: 'saved', label: copy.legendSaved, swatch: [styles.line, { backgroundColor: colors.text }] },
  ];
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={item.swatch} />
          <SizedText size={fontSizes.small} color={colors.textSubtle}>
            {item.label}
          </SizedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs2 },
  square: { width: StatsMetrics.legendSwatch, height: StatsMetrics.legendSwatch, borderRadius: radii.xs },
  line: { width: StatsMetrics.legendLineWidth, height: StatsMetrics.legendLineHeight, borderRadius: radii.xs },
});

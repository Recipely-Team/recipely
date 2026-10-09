import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { DeltaChip } from '@presentation/app/automations/stats/items/delta-chip';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { fontSizes, fontWeights, letterSpacings, spacing } from '@presentation/base/theme';

export interface FunnelCellProps {
  label: string;
  value: string;
  /** "35% of sent", or "on 4 posts" for the first step. */
  caption: string;
  current: number;
  previous: number;
  days: number;
  wide: boolean;
}

/** One funnel step: uppercase label, the big number, its rate line and the delta. */
export const FunnelCell = ({ label, value, caption, current, previous, days, wide }: FunnelCellProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.cell}>
      <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textSubtle} style={styles.label}>
        {label.toUpperCase()}
      </SizedText>
      <SizedText size={wide ? fontSizes.largeTitle : fontSizes.title} weight={fontWeights.heavy} style={styles.value}>
        {value}
      </SizedText>
      <SizedText size={fontSizes.small} color={colors.textSubtle}>
        {caption}
      </SizedText>
      <DeltaChip current={current} previous={previous} days={days} />
    </View>
  );
};

const styles = StyleSheet.create({
  cell: { flex: ValueConstants.one, padding: spacing.lg, gap: spacing.xs },
  label: { minHeight: StatsMetrics.funnelLabelMinHeight, letterSpacing: letterSpacings.wide },
  value: { fontVariant: ['tabular-nums'] },
});

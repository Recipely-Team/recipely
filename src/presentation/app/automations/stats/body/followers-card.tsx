import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { CharConstants, ValueConstants } from '@core/constants';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatStatsDay } from '@presentation/app/automations/stats/model/format-stats-day';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface FollowersCardProps {
  stats: CreatorStats;
  wide: boolean;
}

const PAD = 6;
const HALF = 2;
const EDGES = 2;

/**
 * Instagram followers (spec "Followers card"): the latest count, its change
 * over the range and a sparkline from Recipely's own daily snapshots. When
 * tracking began inside the range the line starts there, after a dashed run.
 */
export const FollowersCard = ({ stats, wide }: FollowersCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const surfaces = useSeveritySurfaces();
  const locale = useLocale();
  const copy = t().creatorStats;
  const [width, setWidth] = useState<number>(ValueConstants.zero);
  const height = wide ? StatsMetrics.sparkHeightWide : StatsMetrics.sparkHeight;
  const { current, change, trackingSince, points } = stats.followers;
  const startsInside = trackingSince !== null && trackingSince > stats.from;

  const slots = stats.daily.map((d) => d.day);
  const span = Math.max(ValueConstants.one, slots.length - ValueConstants.one);
  const values = points.map((p) => p.followers);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const xOf = (day: string): number => PAD + ((width - PAD * EDGES) * Math.max(ValueConstants.zero, slots.indexOf(day))) / span;
  const yOf = (v: number): number => (hi === lo ? height / HALF : PAD + (height - PAD * EDGES) * (ValueConstants.one - (v - lo) / (hi - lo)));
  const line = points.map((p, i) => `${i === ValueConstants.zero ? 'M' : 'L'}${xOf(p.day).toFixed(ValueConstants.one)} ${yOf(p.followers).toFixed(ValueConstants.one)}`).join(' ');
  const first = points[ValueConstants.zero];
  const lastPoint = points[points.length - ValueConstants.one];
  const area = first !== undefined && lastPoint !== undefined ? `${line} L${xOf(lastPoint.day).toFixed(ValueConstants.one)} ${height} L${xOf(first.day).toFixed(ValueConstants.one)} ${height} Z` : CharConstants.empty;
  const changeColor = change !== null && change < ValueConstants.zero ? surfaces.danger.text : surfaces.success.text;
  const sign = change !== null && change > ValueConstants.zero ? '+' : change !== null && change < ValueConstants.zero ? '−' : '';

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} accessibilityRole="header">
        {copy.followers}
      </SizedText>
      <View style={styles.figures}>
        <SizedText size={fontSizes.largeTitle} weight={fontWeights.heavy} style={styles.tabular}>
          {current === null ? CharConstants.emDash : formatWholeNumber(current, locale)}
        </SizedText>
        {change !== null ? (
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={changeColor}>
            {`${sign}${formatWholeNumber(Math.abs(change), locale)}`}
          </SizedText>
        ) : null}
        {!startsInside ? (
          <SizedText size={fontSizes.small} color={colors.textSubtle}>
            {`· ${copy.lastDays.replace('{n}', String(stats.days))}`}
          </SizedText>
        ) : null}
      </View>
      <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {width > ValueConstants.zero && first !== undefined ? (
          <Svg width={width} height={height}>
            {startsInside ? (
              <Line x1={PAD} x2={xOf(first.day)} y1={yOf(first.followers)} y2={yOf(first.followers)} stroke={colors.textMuted} strokeWidth={borderWidths.thin} strokeDasharray={StatsMetrics.dashArray} />
            ) : null}
            <Path d={area} fill={colors.chipBackground} />
            <Path d={line} stroke={colors.primary} strokeWidth={StatsMetrics.openedStroke} fill="none" />
            {startsInside ? <Circle cx={xOf(first.day)} cy={yOf(first.followers)} r={StatsMetrics.endDot} fill={colors.primary} /> : null}
            {lastPoint !== undefined ? <Circle cx={xOf(lastPoint.day)} cy={yOf(lastPoint.followers)} r={StatsMetrics.endDot} fill={colors.primary} /> : null}
          </Svg>
        ) : null}
      </View>
      {startsInside && trackingSince !== null ? (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.text} />
          <SizedText size={fontSizes.small} weight={fontWeights.semibold}>
            {copy.trackingSince.replace('{date}', formatStatsDay(trackingSince, locale))}
          </SizedText>
        </View>
      ) : null}
      <SizedText size={fontSizes.small} color={colors.textSubtle}>
        {copy.snapshots}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  figures: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm },
  tabular: { fontVariant: ['tabular-nums'] },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});

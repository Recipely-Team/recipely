import { useState } from 'react';
import { type LayoutChangeEvent, type GestureResponderEvent, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ValueConstants } from '@core/constants';
import type { FunnelDay } from '@domain/instagram/stats/funnel-day';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { ChartLegend } from '@presentation/app/automations/stats/items/chart-legend';
import { chartGeometry } from '@presentation/app/automations/stats/model/chart-geometry';
import { formatStatsDay } from '@presentation/app/automations/stats/model/format-stats-day';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { borderWidths, colorAlphas, fontSizes, fontWeights, radii, shadows, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface DailyChartProps {
  days: readonly FunnelDay[];
  wide: boolean;
}

const HALF = 2;
const AXIS_LABEL_GAP = 6;

/**
 * Daily activity (spec "Daily chart"): Sent as bars, Opened and Saved as
 * lines. Pressing or hovering scrubs a day and shows its numbers; the
 * responder hands the gesture back to the page so vertical scrolling still works.
 */
export const DailyChart = ({ days, wide }: DailyChartProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const copy = t().creatorStats;
  const [width, setWidth] = useState<number>(ValueConstants.zero);
  const [active, setActive] = useState<number | null>(null);
  const height = wide ? StatsMetrics.chartHeightWide : StatsMetrics.chartHeight;
  const g = chartGeometry(days, width, height);
  const last = days.length - ValueConstants.one;
  const ticks = [ValueConstants.zero, Math.floor(last / HALF), last];
  const scrub = (event: GestureResponderEvent): void => setActive(g.indexAt(event.nativeEvent.locationX));
  const shown = active === null ? undefined : days[active];

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} accessibilityRole="header">
        {copy.chart}
      </SizedText>
      <ChartLegend />
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={scrub}
        onResponderMove={scrub}
        onResponderRelease={() => setActive(null)}
        onResponderTerminationRequest={() => true}
        onResponderTerminate={() => setActive(null)}
        onPointerMove={(e) => setActive(g.indexAt(e.nativeEvent.offsetX))}
        onPointerLeave={() => setActive(null)}
        accessible
        accessibilityLabel={copy.chart}
      >
        {width > ValueConstants.zero ? (
          <Svg width={width} height={height}>
            {g.grid.map((line) => (
              <Line key={`g-${line.value}`} x1={g.left} x2={width} y1={line.y} y2={line.y} stroke={colors.border} strokeWidth={borderWidths.hairline} />
            ))}
            {g.grid.map((line) => (
              <SvgText key={`l-${line.value}`} x={g.left - AXIS_LABEL_GAP} y={line.y + AXIS_LABEL_GAP / HALF} fontSize={fontSizes.tiny} fontFamily={StatsMetrics.axisFont} fill={colors.textSubtle} textAnchor="end">
                {formatWholeNumber(line.value, locale)}
              </SvgText>
            ))}
            {g.bars.map((bar, i) => (
              <Rect key={`b-${days[i]?.day ?? i}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={StatsMetrics.barRadius} fill={colors.textMuted + colorAlphas.medium} />
            ))}
            <Path d={g.opened} stroke={colors.primary} strokeWidth={StatsMetrics.openedStroke} fill="none" />
            <Path d={g.saved} stroke={colors.text} strokeWidth={StatsMetrics.savedStroke} fill="none" />
            {active !== null ? <Line x1={g.centreOf(active)} x2={g.centreOf(active)} y1={ValueConstants.zero} y2={height} stroke={colors.textMuted} strokeWidth={borderWidths.hairline} /> : null}
            {ticks.map((i, n) =>
              days[i] === undefined ? null : (
                <SvgText
                  key={`x-${n}`}
                  x={g.centreOf(i)}
                  y={g.labelY}
                  fontSize={fontSizes.tiny}
                  fontFamily={StatsMetrics.axisFont}
                  fill={colors.textSubtle}
                  textAnchor={n === ValueConstants.zero ? 'start' : n === ticks.length - ValueConstants.one ? 'end' : 'middle'}
                >
                  {formatStatsDay(days[i].day, locale)}
                </SvgText>
              ),
            )}
          </Svg>
        ) : null}
        {shown !== undefined && active !== null ? (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              shadows.md,
              { backgroundColor: colors.background, borderColor: colors.cardBorder, left: Math.min(Math.max(ValueConstants.zero, g.centreOf(active) - StatsMetrics.tooltipWidth / HALF), width - StatsMetrics.tooltipWidth) },
            ]}
          >
            <SizedText size={fontSizes.small} weight={fontWeights.bold}>
              {formatStatsDay(shown.day, locale)}
            </SizedText>
            <SizedText size={fontSizes.small} color={colors.textSubtle}>
              {`${copy.legendSent} ${formatWholeNumber(shown.sent, locale)} · ${copy.legendOpened} ${formatWholeNumber(shown.opened, locale)} · ${copy.legendSaved} ${formatWholeNumber(shown.saved, locale)}`}
            </SizedText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  tooltip: {
    position: 'absolute',
    top: ValueConstants.zero,
    width: StatsMetrics.tooltipWidth,
    padding: spacing.sm,
    gap: spacing.xxs,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
});

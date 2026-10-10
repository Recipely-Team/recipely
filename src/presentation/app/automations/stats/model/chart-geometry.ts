import { ValueConstants } from '@core/constants';
import type { FunnelDay } from '@domain/instagram/stats/funnel-day';
import { niceCeiling } from '@presentation/app/automations/stats/model/nice-ceiling';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';

const TOP_PAD = 8;
const BOTTOM_PAD = 20;
const HALF = 2;
const LABEL_BASELINE_PAD = 4;

interface ChartBar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where everything in the daily chart sits for a measured width: one slot per
 * day, bars for Sent and polylines through the slot centres for Opened and
 * Saved, scaled to a 1 / 2 / 5 × 10ⁿ ceiling of the busiest day's sends.
 */
export const chartGeometry = (days: readonly FunnelDay[], width: number, height: number) => {
  const left = StatsMetrics.axisWidth;
  const plotWidth = Math.max(ValueConstants.zero, width - left);
  const plotHeight = height - TOP_PAD - BOTTOM_PAD;
  const max = niceCeiling(Math.max(ValueConstants.zero, ...days.map((d) => d.sent), ...days.map((d) => d.opened)));
  const slot = days.length > ValueConstants.zero ? plotWidth / days.length : plotWidth;
  const barWidth = Math.min(StatsMetrics.barMaxWidth, slot * StatsMetrics.barShare);
  const yOf = (value: number): number => TOP_PAD + plotHeight * (ValueConstants.one - value / max);
  const centreOf = (index: number): number => left + slot * index + slot / HALF;
  const line = (pick: (d: FunnelDay) => number): string =>
    days.map((d, i) => `${i === ValueConstants.zero ? 'M' : 'L'}${centreOf(i).toFixed(ValueConstants.one)} ${yOf(pick(d)).toFixed(ValueConstants.one)}`).join(' ');
  const bars: ChartBar[] = days.map((d, i) => ({
    x: centreOf(i) - barWidth / HALF,
    y: yOf(d.sent),
    width: barWidth,
    height: Math.max(ValueConstants.zero, plotHeight + TOP_PAD - yOf(d.sent)),
  }));
  const grid = [ValueConstants.zero, max / HALF, max].map((value) => ({ value, y: yOf(value) }));
  const indexAt = (x: number): number =>
    Math.min(days.length - ValueConstants.one, Math.max(ValueConstants.zero, Math.floor((x - left) / slot)));
  return { left, max, slot, bars, grid, centreOf, yOf, indexAt, opened: line((d) => d.opened), saved: line((d) => d.saved), labelY: height - LABEL_BASELINE_PAD };
};

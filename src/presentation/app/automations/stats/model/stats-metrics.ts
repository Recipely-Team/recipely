import { scale } from '@presentation/base/theme';

/** Creator stats' own measurements (prototype `creator-stats.jsx`, spec "Tokens & measurements"). */
export const StatsMetrics = {
  chartHeight: scale(160),
  chartHeightWide: 200,
  axisWidth: 30,
  /** SVG text has no app font; the generic family reads as the system font on web and Android, and iOS falls back to it. */
  axisFont: 'sans-serif',
  /** Gridlines at 0, ½ and the top. */
  gridSteps: 2,
  barMaxWidth: 14,
  barShare: 0.62,
  barRadius: 2,
  openedStroke: 2.25,
  savedStroke: 1.75,
  sparkHeight: scale(96),
  sparkHeightWide: 150,
  endDot: 3.5,
  dashArray: '3 4',
  tooltipWidth: 150,
  deltaChip: scale(22),
  funnelLabelMinHeight: scale(28),
  postRow: scale(72),
  postThumb: scale(48),
  postsPerPage: 5,
  keywordsShown: 2,
  keywordsShownWide: 4,
  /** Content width from which the funnel is one row of four. */
  funnelRowMinWidth: 600,
  /** Content width from which chart + followers sit side by side and posts become a table. */
  wideMinWidth: 720,
  chartShare: 1.7,
  followersShare: 1,
  noSendsFollowersMaxWidth: 420,
  legendSwatch: 10,
  legendLineWidth: 14,
  legendLineHeight: 3,
  /** Table columns: Post, then Sent, Opened, Saved, Open rate — wider than the prototype's 76 / 84 / 92 so Turkish headers fit on one line. */
  postColumn: 56,
  numberColumn: 92,
  savedColumn: 100,
  rateColumn: 108,
} as const;

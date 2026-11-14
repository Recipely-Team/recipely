import { scale } from '@presentation/base/theme';

/** Measurements only the paywall uses (Board · Premium and AI Limit, specs §1). */
export const PaywallMetrics = {
  iconTile: scale(64),
  iconGlyph: scale(30),
  benefitDot: scale(24),
  planCardMinHeight: scale(104),
  planRadio: scale(22),
  contentMaxWidth: scale(520),
  priceSkeletonWidth: scale(90),
  priceSkeletonHeight: scale(18),
} as const;

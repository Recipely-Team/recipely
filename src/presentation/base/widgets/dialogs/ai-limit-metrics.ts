import { scale } from '@presentation/base/theme';

/** Measurements only the AI-limit dialog uses (Board · Premium and AI Limit, spec §2). */
export const AiLimitMetrics = {
  cardMaxWidth: scale(350),
  iconTile: scale(48),
  iconTileRadius: scale(16),
  iconGlyph: scale(24),
  /** Keeps the card scrollable at 200% text instead of running off the screen. */
  cardMaxHeightShare: '82%',
} as const;

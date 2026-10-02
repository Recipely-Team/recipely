import { scale } from '@presentation/base/theme';

/**
 * Measurements only the Instagram connect block and the automations screens
 * draw (Instagram automations spec → Components & measurements).
 */
export const AutomationMetrics = {
  connectButton: scale(48),
  connectMark: scale(22),
  ruleThumb: scale(64),
  ruleThumbWeb: scale(72),
  summaryThumb: scale(56),
  keywordChip: scale(24),
  keywordChipRemovable: scale(32),
  keywordRemove: scale(28),
  emptyDisc: scale(64),
  stepDot: scale(28),
  emptyCtaMaxWidth: scale(340),
  progress: scale(4),
  stepperWidth: 190,
  recipeRow: scale(64),
  recipeThumb: scale(48),
  radio: scale(22),
  postSelectedRing: 3,
  postCheck: scale(24),
  reelBadge: scale(20),
  activityRow: scale(64),
  activityAvatar: scale(36),
  statusPill: scale(24),
  bubbleMaxShare: '82%',
  bubbleRadius: scale(18),
  bubbleTail: scale(4),
  previewCardWidth: scale(220),
  previewAvatar: scale(22),
  previewContextThumb: scale(28),
  pageMaxWidth: 960,
  previewColumn: 300,
  gridColumns: 3,
  gridColumnsWeb: 4,
  keywordsShown: 3,
  /** Spec: a disabled Next / New at 50%. */
  disabledOpacity: 0.5,
  dmTextRows: 5,
} as const;

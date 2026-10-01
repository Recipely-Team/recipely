import { scale, spacing } from '@presentation/base/theme';

/** The creator page's measurements, as the Recipely Prototype draws them (design spec → Creators §6). */
export const CreatorProfileMetrics = {
  /** Recipe tiles across on a phone. */
  phoneColumns: 2,
  /** On an expanded viewport, as many cards as fit at this width — `auto-fill, minmax(270, 1fr)`. */
  minCardWidthExpanded: scale(270),
  /** Between phone tiles: rows, then columns. */
  rowGap: spacing.lg,
  columnGap: spacing.md,
  /** Between web cards, both ways. */
  gapExpanded: spacing.xl,
  /** Each side of the page. */
  gutter: spacing.lg,
  /** The bio's measure, so a long one reads as a paragraph and not a banner. */
  bioMaxWidth: scale(340),
  /** Stats and the follow button stop here on a wide viewport; full width on a phone. */
  summaryMaxWidth: scale(460),
  /** The ring avatar, outer diameter: phone, then expanded. */
  avatar: scale(104),
  avatarExpanded: scale(128),
  /** The seal on a phone tile's photo. */
  tileSeal: scale(24),
} as const;

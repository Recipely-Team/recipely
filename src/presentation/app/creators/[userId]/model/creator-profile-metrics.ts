import { spacing } from '@presentation/base/theme';

/** The creator page's grid and column spacing, as the prototype's phone board draws it. */
export const CreatorProfileMetrics = {
  /** Recipe cards across on a phone and on an expanded viewport. */
  phoneColumns: 2,
  expandedColumns: 3,
  /** Between recipe cards, both ways. */
  gap: spacing.md,
  /** Each side of the page. */
  gutter: spacing.lg,
  /** The bio's measure, so a long one reads as a paragraph and not a banner. */
  bioMaxWidth: 320,
} as const;

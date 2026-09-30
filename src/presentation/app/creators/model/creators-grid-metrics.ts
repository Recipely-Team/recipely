import { spacing } from '@presentation/base/theme';

/** The /creators grid's spacing, as the prototype's phone board draws it. */
export const CreatorsGridMetrics = {
  /** Between cards, both ways. */
  gap: spacing.md,
  /** Each side of the grid. */
  gutter: spacing.lg,
} as const;

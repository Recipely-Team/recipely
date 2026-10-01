import { scale, spacing } from '@presentation/base/theme';

/** The /creators grid's spacing, as the Recipely Prototype draws it (design spec → Creators §5). */
export const CreatorsGridMetrics = {
  /** Cards across on a phone. */
  phoneColumns: 2,
  /** Between cards, both ways, on a phone. */
  gap: spacing.md,
  /** Between cards on an expanded viewport. */
  gapExpanded: spacing.lg2,
  /** The narrowest a card gets on an expanded viewport — `auto-fill, minmax(180, 1fr)`. */
  minCardWidthExpanded: scale(180),
  /** Each side of the grid. */
  gutter: spacing.lg,
} as const;

/**
 * How much room the badge is given to say where a recipe came from.
 *
 * A feed card's meta row already carries a rating and a like button, so there
 * it is a bare glyph; the detail screen is a deliberate stop, so there it says
 * the sentence and — for an import — offers the account it came from.
 */
export const ProvenanceBadgeVariant = {
  /** Icon only, inside a card's existing meta row. */
  Compact: 'compact',
  /** Icon and label, and for an import a tappable handle. */
  Detailed: 'detailed',
} as const;

export type ProvenanceBadgeVariantType =
  (typeof ProvenanceBadgeVariant)[keyof typeof ProvenanceBadgeVariant];

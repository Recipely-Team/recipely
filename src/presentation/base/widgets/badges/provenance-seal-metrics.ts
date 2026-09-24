/**
 * The provenance seal's measurements, as the prototype draws them.
 *
 * @remarks
 * - **The seal's own options**, so they sit beside it rather than in the
 *   theme: the cards and the detail note read them only to pick a seal size.
 * - **Everything inside the seal is a share of its size**, so the card's 27,
 *   the web card's 28 and the detail line's 22 are one drawing at three sizes.
 */
export const provenanceSealMetrics = {
  /** Over a mobile card's photo, beside the cuisine tag. */
  cardSize: 27,
  /** Over a web card's photo, beside the cuisine tag. */
  webCardSize: 28,
  /** In the detail screen's provenance line. */
  pageSize: 22,
  glyphShareOnPhoto: 0.54,
  glyphShareOnPage: 0.6,
  /** Side padding of a two-mark capsule. */
  pairPaddingShare: 0.2,
  gapShare: 0.18,
  dividerHeightShare: 0.42,
  ringOnPhoto: 2,
  ringOnPage: 1,
  divider: 1,
} as const;

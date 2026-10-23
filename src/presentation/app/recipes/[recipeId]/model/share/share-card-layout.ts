/**
 * The share card's canvas, from the Claude Design prototype's
 * `share-card-rn-spec.md` (Share Card Variants): a 360 × 640 card exported ×3
 * to the 1080 × 1920 PNG Instagram Stories / Reels and WhatsApp Status take.
 *
 * @remarks
 * - **A fixed canvas, not a layout.** The card is drawn off-screen at this
 *   size, so it comes out the same on every phone; its text never scales with
 *   the device font size, and its numbers are the design's own dp.
 * - **Instagram safe zones**: text stays between y 84 and 526 (250 px from the
 *   top and 340 px from the bottom of the export); the photo and the fade may
 *   run into them, the bottom `contentPaddingBottom` is plain paper.
 * - **Name tiers** step the title down by length so a long name still fits in
 *   three lines (four at the smallest size).
 */
export const ShareCardLayout = {
  width: 360,
  height: 640,
  exportWidth: 1080,
  exportHeight: 1920,
  photoHeight: 460,
  topScrimHeight: 150,
  fadeHeight: 150,
  /** The fade overlaps the paper below it by this much, or a hairline seam shows between them. */
  fadeSeamOverlap: 1,
  /** Paper alpha along the fade, as hex suffixes, and where each sits (0 = top). */
  fadeAlphas: ['00', '59', 'C7', 'F2'],
  fadeLocations: [0, 0.3, 0.6, 0.85, 1],
  contentPaddingHorizontal: 24,
  contentPaddingBottom: 116,
  nameTiers: [
    { maxChars: 20, size: 36, lineHeight: 38, tracking: -0.9, lines: 3 },
    { maxChars: 34, size: 31, lineHeight: 33, tracking: -0.7, lines: 3 },
  ],
  /** Any name longer than every tier above. */
  longNameTier: { maxChars: Number.POSITIVE_INFINITY, size: 26, lineHeight: 29, tracking: -0.4, lines: 4 },
  meta: { size: 11, lineHeight: 14, tracking: 1.4, marginTop: 12 },
  rule: { marginTop: 18, height: 1, alpha: '24' },
  label: { size: 10, lineHeight: 12, tracking: 1.6, marginTop: 14 },
  ingredients: { size: 14, lineHeight: 20, marginTop: 6, lines: 3 },
  maxIngredients: 5,
  footer: { marginTop: 22, paddingTop: 14, gap: 12, logoGap: 7, logoSize: 22 },
  wordmark: { size: 14, lineHeight: 18, tracking: -0.2 },
  footerText: { size: 11.5, lineHeight: 16 },
  emptyPhoto: {
    logoSize: 132,
    logoTop: 128,
    logoOpacity: 0.28,
    start: { x: 0.33, y: 0 },
    end: { x: 0.67, y: 1 },
  },
  /** Between meta parts and between ingredients: a middle dot with two spaces each side. */
  separator: '  ·  ',
  /** The card's text is part of an image; it must not grow with the device font scale. */
  fontScale: 1,
} as const;

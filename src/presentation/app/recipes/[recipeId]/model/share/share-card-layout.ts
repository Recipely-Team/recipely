/**
 * The share card's canvas: a 9:16 image for Instagram Stories / Reels and
 * WhatsApp Status.
 *
 * @remarks
 * - **A fixed canvas, not a layout.** The card is drawn off-screen at
 *   `width` and exported at `exportWidth × exportHeight`, so it comes out the
 *   same on every phone; that is why its text never scales with the font size.
 * - **`maxIngredients`**: more lines than this crowd the photo, so the rest
 *   are summed up as "+n more".
 */
export const ShareCardLayout = {
  width: 360,
  aspectRatio: 9 / 16,
  exportWidth: 1080,
  exportHeight: 1920,
  maxIngredients: 6,
  logoSize: 40,
  /** The card's text is part of an image; it must not grow with the device font scale. */
  fontScale: 1,
} as const;

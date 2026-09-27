import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Boxes that hold an image or video — thumbnails, covers, hero art.
 *
 * A media box is one of the few places a FIXED dimension is correct: the
 * aspect ratio of a photo does not change with the locale or the font scale,
 * and a grid of covers that each sized themselves to their content would not
 * be a grid. Prefer `aspectRatio` over a height/width pair where the layout
 * allows it; reach for these when one axis has to be pinned.
 */
export const mediaSizes = {
  /** Recipe thumbnail in the share sheet. */
  shareThumb: scale(52),
  /** Draft-card square cover. */
  draftThumb: scale(72),
  /** Brand logo mark on the auth hero. */
  heroLogo: scale(88),
  /** Square hero art on compact auth screens. */
  heroSquare: scale(96),
  /** Review / comment attachment strip. */
  reviewImageHeight: scale(160),
  /** Cap on the recipe-editor cover image. */
  coverMaxHeight: scale(200),
  /** Secondary hero card on the web home. */
  heroMiniMinHeight: scale(205),
  /** Recipe-detail hero image on mobile. */
  heroImageHeight: scale(280),
  /**
   * Cap on a ratio-sized hero. Without it a landscape phone or a tablet would
   * hand the hero a viewport-wide box and push everything below the fold.
   */
  heroImageHeightMax: scale(520),
  /** Cap on the recipe-detail hero in its framed (wide-layout) form. */
  heroImageHeightWeb: scale(560),
} as const;

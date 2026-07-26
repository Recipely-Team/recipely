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
  /** Thumbnail strip cell under the web hero. */
  webDetailThumbHeight: scale(64),
  /** Draft-card square cover. */
  draftThumb: scale(72),
  /** Brand logo mark on the auth hero. */
  heroLogo: scale(88),
  /** Thumbnail strip cell width under the web hero. */
  webDetailThumbWidth: scale(88),
  /** Minimum cuisine tile on a narrow web grid. */
  cuisineTileMinSm: scale(90),
  /** Square hero art on compact auth screens. */
  heroSquare: scale(96),
  /** Minimum cuisine tile on a wide web grid. */
  cuisineTileMin: scale(110),
  /** Review / comment attachment strip. */
  reviewImageHeight: scale(160),
  /** Recipe card cover in the feed. */
  cardImageHeight: scale(180),
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
  heroImageHeightMax: scale(360),
  /** Recipe-detail hero image on the web shell. */
  heroImageHeightWeb: scale(440),
} as const;

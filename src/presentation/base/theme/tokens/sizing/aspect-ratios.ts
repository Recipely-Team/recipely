/**
 * Width-to-height ratios for media boxes, in React Native's `aspectRatio`
 * convention (`width / height`).
 *
 * A ratio is the responsive way to size a photo: the box follows whatever
 * width the column gives it, on a 320pt phone and a tablet alike, where a
 * pinned height only ever matches one screen and letterboxes or crops on every
 * other. Pair a ratio with a max-height from `mediaSizes` when the box would
 * otherwise eat a whole tall viewport.
 */
export const aspectRatios = {
  /** Square tile — grid thumbnails, avatars-as-media. */
  square: 1,
  /** Recipe-detail hero on a phone (the 375×280 design frame). */
  hero: 4 / 3,
  /** Recipe-detail hero in a wide web column — shallower so the page still scrolls. */
  heroWide: 16 / 10,
  /** Card cover strip in a feed. */
  cardCover: 16 / 9,
} as const;

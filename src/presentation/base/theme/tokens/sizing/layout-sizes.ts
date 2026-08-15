/**
 * Page-level geometry: content caps, column gaps, sticky offsets and the
 * collapsing-header metrics.
 *
 * These are deliberately NOT device-scaled. A max-width exists to stop a line
 * of text from getting too long on a wide viewport, so it is a property of the
 * viewport, not of the device's pixel density — scaling it would fight the
 * breakpoints in `@presentation/base/responsive/breakpoints`, which are the
 * component that decides layout at this altitude.
 */
export const layoutSizes = {
  /**
   * Largest share of the viewport HEIGHT the home hero may claim. A share, not
   * a pixel count, so a short landscape window gets a short hero and a tall one
   * gets a taller one — and neither hands the whole fold to a single card.
   *
   * It is applied by converting it into a max WIDTH through the hero's aspect
   * ratio: a max-height and a ratio cannot both hold, and clamping the height
   * is what let the card drift into a 2.6:1 letterbox. Tune the hero's size
   * here; everything else about it is derived.
   *
   * Set high on purpose. Narrowing the band is what breaks its alignment with
   * the banner and the grid below, so this is a guard for genuinely short
   * windows (a 1920x700 letterbox), not a routine constraint — at 0.42 it bit
   * on an ordinary 1557x784 laptop window, and at 0.55 it still bit at
   * 1440x900, where the band is two columns and the featured card takes 5/8 of
   * the width instead of 5/11. Both left the band visibly inset from everything
   * under it. At this value 1440x900, 1557x784 and 1900x957 all span the feed;
   * a 1920x700 letterbox still narrows, which is the case the guard is for.
   */
  heroViewportShare: 0.62,
  /** Centered text-block caps, ascending. */
  maxContentXs: 300,
  maxContentSm: 320,
  maxContentMd: 340,
  maxContentLg: 420,
  maxContentXl: 460,
  /** Cap on the centered FeedbackDialog card (phone-sized on tablet/web). */
  dialogMaxWidth: 400,
  /** Cap on the centered auth card in the register/login split layout. */
  authCardMaxWidth: 520,
  /** Cap on a centered web modal. */
  webModalMaxWidth: 720,
  /** Cap on the web shell's content column. */
  webContentMax: 1200,
  /** Below this viewport width the web recipe detail collapses to one column. */
  webDetailTwoColMin: 1024,
  /** Gap between the web detail's main column and its sticky sidebar. */
  webDetailColGap: 36,
  /** Vertical gap between stacked sidebar cards. */
  webDetailStackGap: 18,
  /** Offset of the sticky sidebar from the top of the scroll container. */
  webDetailStickyTop: 88,
  /** Minimum width of the web sort popover, anchored to its trigger. */
  webSortMenuMinWidth: 200,
  /** Cap on a scrollable dropdown / option popover. */
  dropdownMaxHeight: 200,
  /** Expanded height of the collapsing home header. */
  homeHeaderMax: 132,
  /** Fully collapsed height of the home header. */
  homeHeaderMin: 0,
  /** Scroll distance over which the home title shrinks away. */
  homeTitleShrink: 96,
  /**
   * Android pull-to-refresh spinner offset for the home feed. Android's
   * SwipeRefreshLayout rests the circle at `offset + 64dp(target) - diameter`,
   * so passing `homeHeaderMax` directly parks it ~60dp below the band, over
   * the AI banner; this tucks its resting spot just under the band instead.
   */
  homeRefreshOffsetAndroid: 92,
  /** Top padding that clears the hero art on the auth screens. */
  heroPaddingTop: 76,
} as const;

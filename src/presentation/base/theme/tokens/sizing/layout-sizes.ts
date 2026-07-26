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

import { BREAKPOINTS, WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { spacing } from '@presentation/base/theme';

/**
 * The gutter the feed paints on each side, per the wide-screen home design:
 * 32 on a desktop column, 24 on a tablet, 16 on a phone. It narrows with the
 * viewport so a small screen spends its width on content rather than margin.
 */
export const feedGutter = (viewportWidth: number): number => {
  if (viewportWidth >= BREAKPOINTS.desktop) return spacing.xxl;
  if (viewportWidth >= BREAKPOINTS.tablet) return spacing.xl;
  return spacing.md;
};

/**
 * The width the feed's content actually gets: the route cap, less the gutter.
 *
 * Everything laid out inside the feed must ask this rather than re-deriving it.
 * The column maths, the feed container and the hero band were three separate
 * expressions of the same number, and when they disagreed the feed shipped with
 * no gutter at all while the arithmetic sizing its cards assumed one.
 */
export const feedContentWidth = (viewportWidth: number): number =>
  Math.min(viewportWidth, WEB_CONTENT_MAX_WIDTH.recipes) - feedGutter(viewportWidth) * 2;

/**
 * The inset the PHONE feed paints on each side of every row.
 *
 * Separate from {@link feedGutter}, which serves the expanded layout and its
 * content cap; the two are different numbers on purpose and always have been.
 * It is named here because a second reader appeared: an adaptive banner is
 * requested at a WIDTH, and a banner asking for the device width inside a
 * padded list renders edge to edge past the cards it sits between.
 */
export const MOBILE_FEED_GUTTER = spacing.lg;

/**
 * The width one phone-feed row actually occupies — what an ad must ask for to
 * line up with the cards above and below it.
 */
export const mobileFeedRowWidth = (viewportWidth: number): number =>
  viewportWidth - MOBILE_FEED_GUTTER * 2;

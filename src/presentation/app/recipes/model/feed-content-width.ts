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

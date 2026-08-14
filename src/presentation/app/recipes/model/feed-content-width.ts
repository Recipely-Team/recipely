import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { spacing } from '@presentation/base/theme';

/**
 * The width the feed's content actually gets: the route cap, less the gutter the
 * feed paints on each side.
 *
 * Everything laid out inside the feed must ask this rather than re-deriving it.
 * The column maths, the feed container and the hero band were three separate
 * expressions of the same number, and when they disagreed the feed shipped with
 * no gutter at all while the arithmetic sizing its cards assumed one.
 */
export const feedContentWidth = (viewportWidth: number): number =>
  Math.min(viewportWidth, WEB_CONTENT_MAX_WIDTH.recipes) - spacing.xl * 2;

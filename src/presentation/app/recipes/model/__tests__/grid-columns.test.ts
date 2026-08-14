/**
 * Reported from the web app: "the number of recipes across should grow as the
 * window widens and shrink as it narrows, but it never changes until it drops
 * to one on mobile."
 *
 * It was frozen at three from a 1200px window all the way to a 4K one, because
 * the column maths clamped the available width to the same 1200 cap the
 * reading surfaces use: `Math.min(width, cap)` is constant above the cap, so
 * every pixel past it bought nothing. A grid of cards has no line length to
 * protect, so its cap is now far wider than the recipe detail's.
 *
 * This pins the arithmetic rather than the component: the cap and the card
 * width are the two knobs, and the bug was that one of them was shared with a
 * surface that wanted the opposite thing.
 */
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';
import { spacing } from '@presentation/base/theme';

/** Mirrors the memo in `use-recipe-list`; kept in step by the assertions below. */
const RECIPE_CARD_MIN_WIDTH = 300;
const GRID_GAP = spacing.lg2;

const columnsAt = (width: number): number =>
  Math.max(1, Math.floor((feedContentWidth(width) + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));

describe('recipe grid columns follow the viewport', () => {
  it('adds a column as the window widens', () => {
    expect(columnsAt(1440)).toBeGreaterThan(columnsAt(1200));
    expect(columnsAt(1920)).toBeGreaterThan(columnsAt(1440));
  });

  // The counts the wide-screen home design draws, at the widths it draws them.
  it('lands on the design column counts', () => {
    expect(columnsAt(1920)).toBe(5);
    expect(columnsAt(1440)).toBe(4);
    expect(columnsAt(1030)).toBe(3);
    expect(columnsAt(880)).toBe(2);
  });

  // The regression: every one of these used to answer 3.
  it('does not freeze once past the reading-surface cap', () => {
    const wide = new Set([1440, 1600, 1920].map(columnsAt));

    expect(wide.size).toBeGreaterThan(1);
  });

  it('drops columns as the window narrows', () => {
    expect(columnsAt(900)).toBeLessThan(columnsAt(1440));
  });

  it('caps browsing far wider than the recipe detail, which protects line length', () => {
    expect(WEB_CONTENT_MAX_WIDTH.recipes).toBeGreaterThan(WEB_CONTENT_MAX_WIDTH.recipeDetail);
  });
});

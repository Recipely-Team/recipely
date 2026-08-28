import { ListConstants } from '@presentation/base/constants';

/**
 * "Webde sonsuz kaydırma çalışmıyor."
 *
 * The wide layout's grid is a `FlatList` INSIDE the feed's `ScrollView`. A
 * nested list neither virtualises nor fires `onEndReached` — the parent owns
 * the scrolling — so the web feed showed its first page and stopped. Nothing
 * was asking for the next one.
 *
 * The scroller that actually scrolls now asks. This pins the arithmetic that
 * decides when, because it is the part that is easy to get backwards.
 */
const nearEnd = (offsetY: number, contentHeight: number, viewportHeight: number): boolean =>
  contentHeight - (offsetY + viewportHeight) <= viewportHeight * ListConstants.endReachedThreshold;

const VIEWPORT = 900;
const CONTENT = 5_000;

describe('when the web feed asks for the next page', () => {
  it('does not ask at the top', () => {
    expect(nearEnd(0, CONTENT, VIEWPORT)).toBe(false);
  });

  it('does not ask in the middle', () => {
    expect(nearEnd(2_000, CONTENT, VIEWPORT)).toBe(false);
  });

  // Half a viewport out, so rows arrive before the reader reaches them.
  it('asks half a screen before the end', () => {
    const halfScreenLeft = CONTENT - VIEWPORT - VIEWPORT * ListConstants.endReachedThreshold;
    expect(nearEnd(halfScreenLeft, CONTENT, VIEWPORT)).toBe(true);
  });

  it('asks at the very bottom', () => {
    expect(nearEnd(CONTENT - VIEWPORT, CONTENT, VIEWPORT)).toBe(true);
  });

  // A page shorter than the window has no scroll to do; it must still count as
  // ended, or a short first page would never load a second.
  it('asks when the content does not fill the window', () => {
    expect(nearEnd(0, 400, VIEWPORT)).toBe(true);
  });
});

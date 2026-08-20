/**
 * Unit tests for the feed's width arithmetic — the expanded gutter/content
 * pair, and the phone row width an ad has to be requested at.
 */
import {
  MOBILE_FEED_GUTTER,
  feedContentWidth,
  feedGutter,
  mobileFeedRowWidth,
} from '@presentation/app/recipes/model/feed-content-width';
import { BREAKPOINTS, WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';

describe('feedGutter', () => {
  it('narrows with the viewport, so a small screen spends its width on content', () => {
    const desktop = feedGutter(BREAKPOINTS.desktop);
    const tablet = feedGutter(BREAKPOINTS.tablet);
    const phone = feedGutter(BREAKPOINTS.tablet - 1);

    expect(desktop).toBeGreaterThan(tablet);
    expect(tablet).toBeGreaterThan(phone);
  });
});

describe('feedContentWidth', () => {
  it('takes the gutter off both sides of the viewport below the cap', () => {
    const width = BREAKPOINTS.tablet;

    expect(feedContentWidth(width)).toBe(width - feedGutter(width) * 2);
  });

  it('never grows past the route cap, however wide the window gets', () => {
    const huge = WEB_CONTENT_MAX_WIDTH.recipes * 3;

    expect(feedContentWidth(huge)).toBe(
      WEB_CONTENT_MAX_WIDTH.recipes - feedGutter(huge) * 2,
    );
  });
});

describe('mobileFeedRowWidth', () => {
  // The banner used to be requested at the full device width and rendered at
  // it, past the padding the cards around it sat inside.
  it('is the viewport less the gutter the phone feed pads with on each side', () => {
    expect(mobileFeedRowWidth(390)).toBe(390 - MOBILE_FEED_GUTTER * 2);
  });
});

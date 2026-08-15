/**
 * Reported: "make the filters like the mobile ones — and the scroll button on
 * the right does not work". It did not: the horizontal rail's chevron was
 * decorative, a control that looked tappable and did nothing.
 *
 * The fix was to stop scrolling sideways at all. Wrapped rows have no hidden
 * state, so nothing has to advertise them — but they have to stay CAPPED, or
 * the catalogue grows back down the page and pushes the recipes off the fold,
 * which is the complaint the rail existed to fix in the first place.
 */
import { railChipCount } from '@presentation/app/recipes/model/filtering/cuisine-rail-rows';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';

const at = (viewportWidth: number, viewportHeight: number): number =>
  railChipCount(feedContentWidth(viewportWidth), viewportWidth, viewportHeight);

describe('cuisine rail rows', () => {
  it('fits more chips per row as the column widens', () => {
    expect(at(1836, 1000)).toBeGreaterThan(at(1030, 1000));
  });

  // "2-3 rows if there is room on screen" — the third row is spent on the fold,
  // so it has to be earned by width as well as height. A portrait iPad is tall
  // but narrow: giving it three rows wrapped the budget onto four.
  it('spends a third row only where there is both width and height for it', () => {
    expect(at(1920, 1100)).toBeGreaterThan(at(1920, 700));
    expect(at(1032, 1376)).toBeLessThan(at(1920, 1100));
  });

  it('pays for the reset chip, so the budget does not orphan a row', () => {
    // Whatever the cap is, adding the leading "All" chip must not wrap.
    for (const [w, h] of [[1032, 1376], [1440, 1000], [1920, 1100]] as const) {
      const perRow = Math.max(1, Math.floor((feedContentWidth(w) + 24) / 80));
      expect((at(w, h) + 1) % perRow === 0 || at(w, h) + 1 < perRow * 3).toBe(true);
    }
  });

  it('never runs unbounded — the cap is the whole point', () => {
    const hugeCatalogue = 500;

    expect(at(1836, 1400)).toBeLessThan(hugeCatalogue);
    expect(at(1030, 800)).toBeLessThan(at(1836, 1400));
  });

  it('always shows at least one chip, however narrow the column', () => {
    expect(railChipCount(0, 320, 600)).toBeGreaterThanOrEqual(1);
  });
});

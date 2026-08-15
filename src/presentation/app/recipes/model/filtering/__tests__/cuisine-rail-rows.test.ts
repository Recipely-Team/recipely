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
  railChipCount(feedContentWidth(viewportWidth), viewportHeight);

describe('cuisine rail rows', () => {
  it('fits more chips per row as the column widens', () => {
    expect(at(1836, 1000)).toBeGreaterThan(at(1030, 1000));
  });

  // "2-3 rows if there is room on screen" — the third row is the one that has
  // to be earned, because it is spent on the fold.
  it('spends a third row only on a viewport tall enough for it', () => {
    const tall = at(1440, 1000);
    const short = at(1440, 700);

    expect(tall).toBeGreaterThan(short);
    expect(tall / short).toBeCloseTo(3 / 2, 5);
  });

  it('never runs unbounded — the cap is the whole point', () => {
    const hugeCatalogue = 500;

    expect(at(1836, 1400)).toBeLessThan(hugeCatalogue);
    expect(at(1030, 800)).toBeLessThan(at(1836, 1400));
  });

  it('always shows at least one chip, however narrow the column', () => {
    expect(railChipCount(0, 600)).toBeGreaterThanOrEqual(1);
  });
});

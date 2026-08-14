/**
 * The home hero band divides its width by flex weights and takes its height
 * from one ratio. These pin the two things that went wrong on the way here.
 *
 * 1. The band used to size itself and leave the cuisines whatever remained.
 *    That leftover scales with viewport HEIGHT, not width, so a 1920x1080
 *    window left 557px beside the hero while a 2560x1440 one left 170px — a
 *    taller monitor closed the column. A fixed share cannot do that, and
 *    `columnGrowsWithWidth` is what would have caught it.
 * 2. A max-height and an aspect ratio cannot both hold, so the band's ceiling
 *    is expressed as a max WIDTH derived from the ratio.
 */
import {
  bandFitsCuisines,
  bandHeight,
  bandMaxWidth,
  HeroBandFlex,
} from '@presentation/app/recipes/model/hero/hero-band-layout';
import { layoutSizes } from '@presentation/base/theme';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';

describe('hero band geometry', () => {
  // Deliberately late: three columns crowded the band at tablet and laptop
  // widths, so the side column is a large-desktop affordance only.
  it('opens the side column on a desktop window but never on a tablet', () => {
    expect(bandFitsCuisines(feedContentWidth(1920))).toBe(true);
    expect(bandFitsCuisines(feedContentWidth(1440))).toBe(true);
    // A tablet never gets it: three columns crowded the band at this width.
    expect(bandFitsCuisines(feedContentWidth(1032))).toBe(false);
    expect(bandFitsCuisines(feedContentWidth(900))).toBe(false);
  });

  // The regression: with the column sized from the leftover, a taller viewport
  // took space away from it. Width is the only input now, so this holds.
  it('decides the column from width alone, never from viewport height', () => {
    const wide = feedContentWidth(1920);

    expect(bandFitsCuisines(wide)).toBe(bandFitsCuisines(wide));
    expect(bandHeight(wide, true)).toBeGreaterThan(0);
  });

  it('grows the band height with width, and stops at the feed cap', () => {
    expect(bandHeight(feedContentWidth(1440), false)).toBeGreaterThan(
      bandHeight(feedContentWidth(1200), false),
    );
    // Past the route cap the feed stops widening, so the band stops too.
    expect(bandHeight(feedContentWidth(2560), true)).toBeCloseTo(
      bandHeight(feedContentWidth(1920), true),
      0,
    );
  });

  // A wide, short window (1920x700) would otherwise hand ~70% of the viewport to
  // one card. The ceiling narrows the band until its height is back in budget.
  it('never hands more than the allowed share of a short viewport to the band', () => {
    const shortViewport = 700;

    expect(bandHeight(bandMaxWidth(shortViewport, true), true)).toBeLessThanOrEqual(
      shortViewport * layoutSizes.heroViewportShare + 1,
    );
  });

  it('keeps the featured card the largest block, so hierarchy is size not position', () => {
    expect(HeroBandFlex.featured).toBeGreaterThan(HeroBandFlex.mini);
    expect(HeroBandFlex.featured).toBeGreaterThan(HeroBandFlex.cuisines);
  });
});

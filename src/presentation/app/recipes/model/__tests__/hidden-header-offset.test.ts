/**
 * Reported from the home feed: "when you scroll, the search field sits behind
 * the status bar — it shouldn't show at all". The band hid by exactly its own
 * height, but it starts at `insets.top`, so that left the last `insets.top`
 * points of it (the search field) on screen under the clock.
 */

import { hiddenHeaderOffset } from '@presentation/app/recipes/model/hidden-header-offset';
import { layoutSizes } from '@presentation/base/theme';

describe('hiddenHeaderOffset', () => {
  it('carries the safe-area inset along with the band height', () => {
    const notchInset = 59;

    expect(hiddenHeaderOffset(notchInset)).toBe(-(layoutSizes.homeHeaderMax + notchInset));
  });

  it('travels far enough to clear the top of the screen', () => {
    // The band's bottom edge starts at `insetTop + homeHeaderMax`; after the
    // move it must be at or above 0, or part of it is still visible.
    for (const insetTop of [0, 20, 47, 59]) {
      expect(insetTop + layoutSizes.homeHeaderMax + hiddenHeaderOffset(insetTop)).toBeLessThanOrEqual(0);
    }
  });

  it('is exactly the band height on a device with no top inset', () => {
    expect(hiddenHeaderOffset(0)).toBe(-layoutSizes.homeHeaderMax);
  });
});

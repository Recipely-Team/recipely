import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import type { WindowPosture } from '@domain/display/window-posture';
import { splitAtHinge } from '@presentation/base/responsive/fold/split-at-hinge';

// A spanned Surface Duo: two 540 dp screens either side of a 34 dp hinge.
const DUO_WIDTH = 1114;
const DUO_HEIGHT = 720;
const duoSpanned: WindowPosture = {
  isSeparating: true,
  orientation: FoldOrientation.Vertical,
  state: FoldState.Flat,
  hinge: { x: 540, y: 0, width: 34, height: 720 },
};

describe('splitAtHinge — two panes, nothing under the hinge', () => {
  it('gives a spanned Duo its two 540 dp screens and leaves the hinge empty', () => {
    expect(splitAtHinge(DUO_WIDTH, DUO_HEIGHT, duoSpanned)).toEqual({
      first: { x: 0, y: 0, width: 540, height: 720 },
      second: { x: 574, y: 0, width: 540, height: 720 },
    });
  });

  it('splits a half-opened Fold in tabletop posture top and bottom along a zero-width fold', () => {
    const tabletop: WindowPosture = {
      isSeparating: true,
      orientation: FoldOrientation.Horizontal,
      state: FoldState.HalfOpened,
      hinge: { x: 0, y: 420, width: 841, height: 0 },
    };

    expect(splitAtHinge(841, 840, tabletop)).toEqual({
      first: { x: 0, y: 0, width: 841, height: 420 },
      second: { x: 0, y: 420, width: 841, height: 420 },
    });
  });

  it('does not split a flat, fully opened Fold — content may cross that fold', () => {
    expect(splitAtHinge(884, 1104, { ...duoSpanned, isSeparating: false, hinge: { x: 442, y: 0, width: 0, height: 1104 } })).toBeNull();
  });

  it('does not split without a fold', () => {
    expect(splitAtHinge(DUO_WIDTH, DUO_HEIGHT, null)).toBeNull();
  });

  it('does not split when the hinge sits on the window edge (an app on one Duo screen)', () => {
    expect(splitAtHinge(540, DUO_HEIGHT, duoSpanned)).toBeNull();
    expect(splitAtHinge(DUO_WIDTH, DUO_HEIGHT, { ...duoSpanned, hinge: { ...duoSpanned.hinge, x: 0 } })).toBeNull();
  });
});

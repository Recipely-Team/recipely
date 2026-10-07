import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import { postureFromSegments } from '@infrastructure/display/posture-from-segments';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe('postureFromSegments', () => {
  it('reads two side-by-side segments as a vertical hinge in the gap between them', () => {
    const posture = postureFromSegments([rect(0, 0, 400, 800), rect(420, 0, 400, 800)], false);

    expect(posture).toEqual({
      isSeparating: true,
      orientation: FoldOrientation.Vertical,
      state: FoldState.Flat,
      hinge: { x: 400, y: 0, width: 20, height: 800 },
    });
  });

  it('reads two stacked segments as a horizontal hinge, half-opened when folded', () => {
    const posture = postureFromSegments([rect(0, 0, 800, 400), rect(0, 430, 800, 400)], true);

    expect(posture).toEqual({
      isSeparating: true,
      orientation: FoldOrientation.Horizontal,
      state: FoldState.HalfOpened,
      hinge: { x: 0, y: 400, width: 800, height: 30 },
    });
  });

  it('accepts segments that touch with no visible hinge', () => {
    expect(postureFromSegments([rect(0, 0, 400, 800), rect(400, 0, 400, 800)], false)?.hinge.width).toBe(0);
  });

  it.each([
    ['no segment list', null],
    ['a single screen', [rect(0, 0, 800, 800)]],
    ['three segments', [rect(0, 0, 100, 100), rect(100, 0, 100, 100), rect(200, 0, 100, 100)]],
    ['overlapping segments', [rect(0, 0, 400, 800), rect(300, 100, 400, 800)]],
  ])('reports no posture for %s', (_label, segments) => {
    expect(postureFromSegments(segments, true)).toBeNull();
  });
});

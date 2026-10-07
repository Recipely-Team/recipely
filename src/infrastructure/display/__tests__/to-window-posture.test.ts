import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import { toWindowPosture } from '@infrastructure/display/to-window-posture';

const raw = {
  isSeparating: true,
  orientation: 'vertical',
  state: 'halfOpened',
  x: 420,
  y: 0,
  width: 0,
  height: 701,
};

describe('toWindowPosture — the Kotlin module payload', () => {
  it('maps a half-opened Pixel Fold held as a book', () => {
    expect(toWindowPosture(raw)).toEqual({
      isSeparating: true,
      orientation: FoldOrientation.Vertical,
      state: FoldState.HalfOpened,
      hinge: { x: 420, y: 0, width: 0, height: 701 },
    });
  });

  it('drops a word this build does not know rather than guessing the axis', () => {
    expect(toWindowPosture({ ...raw, orientation: 'diagonal' })).toBeNull();
    expect(toWindowPosture({ ...raw, state: 'closed' })).toBeNull();
  });

  it('answers null for no folding feature', () => {
    expect(toWindowPosture(null)).toBeNull();
  });
});

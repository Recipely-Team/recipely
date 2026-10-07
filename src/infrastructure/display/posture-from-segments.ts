import type { DisplayRect } from '@domain/display/display-rect';
import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import type { WindowPosture } from '@domain/display/window-posture';

const SPANNED_SEGMENT_COUNT = 2;

/**
 * Derives the hinge from the Viewport Segments API's two segments: it is the
 * gap between them.
 *
 * @remarks
 * - **Side by side means a vertical hinge** (`horizontal-viewport-segments: 2`, a
 *   spanned Duo held as a book); stacked means a horizontal one.
 * - **Anything but exactly two segments is "no fold".** The API reports one
 *   segment on an ordinary screen and the spec allows more, which no shipping
 *   device produces; guessing a split for those would be worse than none.
 * - **Segments only exist while the window spans the fold**, so the posture is
 *   always separating; whether it is half opened comes from the Device Posture
 *   API, passed in as `isFolded`.
 */
export const postureFromSegments = (
  segments: readonly DisplayRect[] | null,
  isFolded: boolean,
): WindowPosture | null => {
  if (segments === null || segments.length !== SPANNED_SEGMENT_COUNT) return null;
  const [first, second] = segments;
  const state = isFolded ? FoldState.HalfOpened : FoldState.Flat;
  const firstRight = first.x + first.width;
  const firstBottom = first.y + first.height;
  if (second.x >= firstRight) {
    return {
      isSeparating: true,
      orientation: FoldOrientation.Vertical,
      state,
      hinge: { x: firstRight, y: first.y, width: second.x - firstRight, height: first.height },
    };
  }
  if (second.y >= firstBottom) {
    return {
      isSeparating: true,
      orientation: FoldOrientation.Horizontal,
      state,
      hinge: { x: first.x, y: firstBottom, width: first.width, height: second.y - firstBottom },
    };
  }
  return null;
};

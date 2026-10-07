import { ValueConstants } from '@core/constants';
import { FoldOrientation } from '@domain/display/fold-orientation';
import type { WindowPosture } from '@domain/display/window-posture';
import type { FoldPanes } from '@presentation/base/responsive/fold/fold-panes';

/**
 * The two pane rectangles a window of `width` × `height` splits into around the
 * hinge, or `null` when there is nothing to split around.
 *
 * @remarks
 * - **Only a separating fold splits.** A flat, fully opened Fold reports a fold
 *   content may cross; laying out around it would waste the seamless screen.
 * - **A hinge at or past the window's edge is no split.** The window can sit in
 *   one segment (an unspanned Duo app) while the OS still reports the feature;
 *   a zero-width pane is not a layout.
 */
export const splitAtHinge = (width: number, height: number, fold: WindowPosture | null): FoldPanes | null => {
  if (fold === null || !fold.isSeparating) return null;
  const { hinge } = fold;
  const origin = ValueConstants.zero;
  if (fold.orientation === FoldOrientation.Vertical) {
    const secondX = hinge.x + hinge.width;
    if (hinge.x <= origin || secondX >= width) return null;
    return {
      first: { x: origin, y: origin, width: hinge.x, height },
      second: { x: secondX, y: origin, width: width - secondX, height },
    };
  }
  const secondY = hinge.y + hinge.height;
  if (hinge.y <= origin || secondY >= height) return null;
  return {
    first: { x: origin, y: origin, width, height: hinge.y },
    second: { x: origin, y: secondY, width, height: height - secondY },
  };
};

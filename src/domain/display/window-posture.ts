import type { DisplayRect } from '@domain/display/display-rect';
import type { FoldOrientationType } from '@domain/display/fold-orientation';
import type { FoldStateType } from '@domain/display/fold-state';

/**
 * A fold or hinge crossing the app's window, as the OS reports it.
 *
 * @remarks
 * - **`isSeparating` is the question layouts ask.** It is true when the window is
 *   split into two logical areas — any physical hinge (Surface Duo spanned), or a
 *   flexible fold that is half opened. A flat, fully opened Fold reports a fold
 *   that is not separating, and content may run across it.
 * - **`hinge` may have zero width.** A flexible fold is a line, not a gap; a Duo's
 *   hinge occludes its full width (34 dp).
 */
export interface WindowPosture {
  readonly isSeparating: boolean;
  readonly orientation: FoldOrientationType;
  readonly state: FoldStateType;
  readonly hinge: DisplayRect;
}

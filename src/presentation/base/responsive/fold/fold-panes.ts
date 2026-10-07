import type { DisplayRect } from '@domain/display/display-rect';

/**
 * The two areas a separating hinge leaves: left then right for a vertical
 * hinge, top then bottom for a horizontal one. Neither includes the hinge.
 */
export interface FoldPanes {
  readonly first: DisplayRect;
  readonly second: DisplayRect;
}

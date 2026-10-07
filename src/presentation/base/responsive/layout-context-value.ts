import type { BreakpointType } from '@presentation/base/responsive/breakpoint-type';

import type { OrientationType } from '@presentation/base/responsive/orientation-type';

import type { WindowPosture } from '@domain/display/window-posture';

export interface LayoutContextValue {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: OrientationType;
  breakpoint: BreakpointType;
  /**
   * The browser chrome is mounted: sticky WebHeader instead of the native app
   * bar, no TabBar, no safe-area insets. Web only — a tablet keeps its native
   * chrome, so ask {@link isExpanded} instead for anything about content width.
   */
  isWebShell: boolean;
  /**
   * There is room for the wide content layout: multi-column grids, the columned
   * recipe detail, per-route max-width caps, centred dialogs instead of bottom
   * sheets. True on any platform once the viewport passes the desktop
   * breakpoint, so an iPad gets it and a Split View pane loses it again.
   */
  isExpanded: boolean;
  /** True for portrait phones and any narrow viewport regardless of platform. */
  isCompact: boolean;
  /**
   * The fold or hinge crossing the window — a spanned Surface Duo, a half-opened
   * Galaxy Z Fold or Pixel Fold — or `null`. Two-pane layouts read it through
   * `useTwoPaneSplit` rather than doing the pane arithmetic themselves.
   */
  fold: WindowPosture | null;
}

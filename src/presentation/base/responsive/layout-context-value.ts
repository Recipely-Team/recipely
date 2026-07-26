import type { BreakpointType } from '@presentation/base/responsive/breakpoint-type';
import type { OrientationType } from '@presentation/base/responsive/orientation-type';

export interface LayoutContextValue {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: OrientationType;
  breakpoint: BreakpointType;
  /** True on Platform.OS === 'web' when the viewport is wide enough for the desktop shell. */
  isWebShell: boolean;
  /** True for portrait phones and any narrow viewport regardless of platform. */
  isCompact: boolean;
}

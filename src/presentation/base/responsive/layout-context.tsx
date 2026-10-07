import { createContext, useMemo, type ReactNode } from 'react';
import { BreakpointType } from '@presentation/base/responsive/breakpoint-type';
import { isWeb } from '@infrastructure/constants/platform';
import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';
import { useIsHydrated } from '@presentation/base/responsive/use-is-hydrated';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { ValueConstants } from '@core/constants';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';
import { useWindowPosture } from '@presentation/base/responsive/fold/use-window-posture';

const DEFAULT_VALUE: LayoutContextValue = {
  width: ValueConstants.zero,
  height: ValueConstants.zero,
  aspectRatio: ValueConstants.one,
  orientation: OrientationType.Portrait,
  breakpoint: 'mobile',
  isWebShell: false,
  isExpanded: false,
  isCompact: true,
  fold: null,
};

export const LayoutContext = createContext<LayoutContextValue>(DEFAULT_VALUE);

export interface LayoutProviderProps {
  children: ReactNode;
  /** The fold-posture port, from the composition root; omitted, `fold` stays `null`. */
  postureSource?: WindowPostureInterface;
}

const resolveBreakpoint = (width: number): BreakpointType => {
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

/**
 * Publishes the current viewport metrics to descendants so screens can pick
 * compact-vs-expanded layouts. Width/height come from `useWindowDimensions()`
 * which updates on resize (web) and rotation (native); `fold` from the posture
 * port, behind the same hydration gate so the static export never splits.
 */
export const LayoutProvider = ({ children, postureSource }: LayoutProviderProps): React.JSX.Element => {
  const { width, height } = useWindowDimensions();
  const hydrated = useIsHydrated();
  const fold = useWindowPosture(postureSource);

  // Static export renders the mobile layout; adopt real dimensions only after hydration.
  const gated = isWeb() && !hydrated;

  const value = useMemo<LayoutContextValue>(() => {
    if (gated) return DEFAULT_VALUE;
    const breakpoint = resolveBreakpoint(width);
    const orientation: OrientationType = width >= height ? OrientationType.Landscape : OrientationType.Portrait;
    // isExpanded is width only (iPad gets grids, Split View falls back); isWebShell is browser chrome.
    const isExpanded = width >= BREAKPOINTS.desktop;
    const isWebShell = isWeb() && isExpanded;
    const isCompact = breakpoint === BreakpointType.Mobile;
    const aspectRatio = height === ValueConstants.zero ? ValueConstants.one : width / height;
    return { width, height, aspectRatio, orientation, breakpoint, isWebShell, isExpanded, isCompact, fold };
  }, [gated, width, height, fold]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

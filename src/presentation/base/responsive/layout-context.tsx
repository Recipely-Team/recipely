import { createContext, useMemo, type ReactNode } from 'react';
import { BreakpointType } from '@presentation/base/responsive/breakpoint-type';
import { isWeb } from '@infrastructure/constants/platform';
import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';
import { useIsHydrated } from '@presentation/base/responsive/use-is-hydrated';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { ValueConstants } from '@core/constants';

const DEFAULT_VALUE: LayoutContextValue = {
  width: ValueConstants.zero,
  height: ValueConstants.zero,
  aspectRatio: ValueConstants.one,
  orientation: OrientationType.Portrait,
  breakpoint: 'mobile',
  isWebShell: false,
  isExpanded: false,
  isCompact: true,
};

export const LayoutContext = createContext<LayoutContextValue>(DEFAULT_VALUE);

export interface LayoutProviderProps {
  children: ReactNode;
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
 * which updates on resize (web) and rotation (native).
 */
export const LayoutProvider = ({ children }: LayoutProviderProps): React.JSX.Element => {
  const { width, height } = useWindowDimensions();
  const hydrated = useIsHydrated();

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
    return { width, height, aspectRatio, orientation, breakpoint, isWebShell, isExpanded, isCompact };
  }, [gated, width, height]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

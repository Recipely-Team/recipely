import { createContext, useMemo, type ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';
import { useIsHydrated } from '@presentation/base/responsive/use-is-hydrated';
import type { BreakpointType } from '@presentation/base/responsive/breakpoint-type';
import type { OrientationType } from '@presentation/base/responsive/orientation-type';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { ValueConstants } from '@core/constants';

const DEFAULT_VALUE: LayoutContextValue = {
  width: ValueConstants.zero,
  height: ValueConstants.zero,
  aspectRatio: 1,
  orientation: 'portrait',
  breakpoint: 'mobile',
  isWebShell: false,
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

  // The static web export prerenders with no viewport, so the server HTML is
  // always the mobile/non-shell layout. Reproduce that on the first client
  // render (DEFAULT_VALUE) and only adopt the real dimensions after hydration,
  // otherwise the desktop shell mounts mid-hydration and React throws #418.
  // Native has no hydration step, so it always uses the live dimensions.
  const gated = Platform.OS === 'web' && !hydrated;

  const value = useMemo<LayoutContextValue>(() => {
    if (gated) return DEFAULT_VALUE;
    const breakpoint = resolveBreakpoint(width);
    const orientation: OrientationType = width >= height ? 'landscape' : 'portrait';
    const isWebShell = Platform.OS === 'web' && width >= BREAKPOINTS.desktop;
    const isCompact = breakpoint === 'mobile';
    const aspectRatio = height === ValueConstants.zero ? 1 : width / height;
    return { width, height, aspectRatio, orientation, breakpoint, isWebShell, isCompact };
  }, [gated, width, height]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

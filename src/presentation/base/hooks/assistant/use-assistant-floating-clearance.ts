import { usePathname } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';
import { controlSizes, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/**
 * Routes that already put a floating control in the bottom-right corner.
 *
 * Only the feed does, today. Asked by path for the same reason `useTabBarState`
 * is: the assistant is mounted once for the whole app and cannot be told by a
 * screen it does not know about.
 */
const OCCUPIED_CORNERS: readonly string[] = [RoutePaths.recipes];

/**
 * How far the assistant must sit above the bottom edge to clear the screen's
 * own floating control.
 *
 * The feed's filter button and the assistant both docked to the same corner at
 * the same height, so the chef landed squarely on top of it — covering the one
 * control that screen exists to offer.
 *
 * The first clearance cleared it and no more: `spacing.md` between two round
 * controls that each carry a shadow reads as one joined blob rather than two
 * buttons ("asistan ile filtre birleşik"). `spacing.lg` is the smallest gap
 * that separates them visually. The filter's own box is a `minHeight`, so it
 * can grow past `fabExtended` with a larger font setting — which is the other
 * reason the gap wants slack rather than exactness.
 */
export const useAssistantFloatingClearance = (): number => {
  const pathname = usePathname();
  // Exact, not a prefix: `/recipes/42` is a detail screen with no filter
  // button, and matching by prefix lifted the assistant off the bottom edge on
  // the app's second-busiest screen for a control that is not there.
  const occupied = OCCUPIED_CORNERS.includes(pathname);
  return occupied ? controlSizes.fabExtended + spacing.lg : ValueConstants.zero;
};

import { Easing, type SharedValue, useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hiddenHeaderOffset } from '@presentation/app/recipes/model/hidden-header-offset';
import { durations, layoutSizes, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** Snap/timing config for the mobile collapsing header band (Material small-top-app-bar feel). */
const HEADER_TIMING = { duration: durations.headerCollapse, easing: Easing.out(Easing.cubic) } as const;
/** Cumulative upward scroll (px) before the band is revealed again. */
const REVEAL_THRESHOLD = spacing.sm;

/**
 * The phone feed's collapsing header: hides on scroll down, returns on scroll up.
 *
 * @remarks
 * - **Runs on the UI thread.** The handler is a Reanimated worklet and the
 *   header reads only shared values, so scrolling never waits for JavaScript.
 * - **Settles to an edge** when a fling or drag ends, never half-shown.
 * - **Still with reduced motion**: the band stays put; only the scroll
 *   position is tracked, for the assistant and the filter button.
 */
export const useFeedHeaderScroll = (
  shouldReduceMotion: boolean,
): { scrollY: SharedValue<number>; headerTranslateY: SharedValue<number>; scrollHandler: ReturnType<typeof useAnimatedScrollHandler> } => {
  const scrollY = useSharedValue(ValueConstants.zero);
  const headerTranslateY = useSharedValue(ValueConstants.zero);
  const lastScrollY = useSharedValue(ValueConstants.zero);
  const headerHidden = useSharedValue(ValueConstants.zero);
  const hiddenHeaderY = hiddenHeaderOffset(useSafeAreaInsets().top);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.set(y);
      if (shouldReduceMotion) return;
      const delta = y - lastScrollY.get();
      if (y <= layoutSizes.homeHeaderMax) {
        if (headerHidden.get() !== ValueConstants.zero) {
          headerHidden.set(ValueConstants.zero);
          headerTranslateY.set(withTiming(ValueConstants.zero, HEADER_TIMING));
        }
      } else if (delta > ValueConstants.zero && headerHidden.get() !== ValueConstants.one) {
        headerHidden.set(ValueConstants.one);
        headerTranslateY.set(withTiming(hiddenHeaderY, HEADER_TIMING));
      } else if (delta < -REVEAL_THRESHOLD && headerHidden.get() !== ValueConstants.zero) {
        headerHidden.set(ValueConstants.zero);
        headerTranslateY.set(withTiming(ValueConstants.zero, HEADER_TIMING));
      }
      lastScrollY.set(y);
    },
    onMomentumEnd: () => {
      if (shouldReduceMotion) return;
      const shouldHide = headerTranslateY.get() < hiddenHeaderY / ValueConstants.two;
      headerHidden.set(shouldHide ? ValueConstants.one : ValueConstants.zero);
      headerTranslateY.set(withTiming(shouldHide ? hiddenHeaderY : ValueConstants.zero, HEADER_TIMING));
    },
    onEndDrag: () => {
      if (shouldReduceMotion) return;
      const shouldHide = headerTranslateY.get() < hiddenHeaderY / ValueConstants.two;
      headerHidden.set(shouldHide ? ValueConstants.one : ValueConstants.zero);
      headerTranslateY.set(withTiming(shouldHide ? hiddenHeaderY : ValueConstants.zero, HEADER_TIMING));
    },
  });

  return { scrollY, headerTranslateY, scrollHandler };
};

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { isWeb } from '@infrastructure/constants/platform';
import { AnimationConstants } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

/** How long each slide holds before the next one (Onboarding 2026 spec). */
const SLIDE_MS = 6000;

interface OnboardingAutoplay {
  /** 0→1 fill of the active dot while autoplay runs. */
  progress: Animated.Value;
  running: boolean;
  /** Any user input stops autoplay for the rest of the session. */
  stop: () => void;
}

/**
 * Advances the slides every six seconds and fills the active dot as it goes.
 *
 * @remarks
 * - **Stops for good** on any swipe, dot tap or arrow, and on the last slide.
 * - **Never runs** with reduced motion or a screen reader on: a slide that
 *   moves while being read is lost to its reader.
 * - **The screen-reader check is native only.** react-native-web's
 *   `isScreenReaderEnabled` resolves `true` unconditionally (a browser cannot
 *   tell), which kept autoplay off on the web for everyone.
 */
export const useOnboardingAutoplay = (index: number, count: number, advance: () => void): OnboardingAutoplay => {
  const reducedMotion = useReducedMotion();
  const [screenReader, setScreenReader] = useState(false);
  const [stopped, setStopped] = useState(false);
  const progress = useRef(new Animated.Value(AnimationConstants.progressMin)).current;
  const running = !stopped && !reducedMotion && !screenReader && index < count - ValueConstants.one;

  useEffect(() => {
    // Native only: react-native-web always answers true (see the head note).
    if (isWeb()) return;
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    progress.setValue(AnimationConstants.progressMin);
    if (!running) return;
    const fill = Animated.timing(progress, {
      toValue: AnimationConstants.progressMax,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: !isWeb(),
    });
    fill.start(({ finished }) => {
      if (finished) advance();
    });
    return () => fill.stop();
  }, [advance, index, progress, running]);

  return { progress, running, stop: () => setStopped(true) };
};

import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimationConstants } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

import type { ViewStyle } from 'react-native';

/** The three animated layers of the "AI is cooking" showpiece. */
interface GeneratingAnimationResult {
  /** Orbiting dots — one slow clockwise revolution. */
  orbitStyle: ViewStyle;
  /** Outer ring — the same revolution, counter-clockwise. */
  ringStyle: ViewStyle;
  /** Centre mark — a gentle breathing pulse. */
  coreStyle: ViewStyle;
}

/** One full revolution, in degrees. */
const FULL_TURN_DEG = 360;
/** How long the orbit takes to come back around. */
const SPIN_DURATION_MS = 4500;
/** Half-cycle of the core's breathing pulse — it plays in, then back out. */
const BREATHE_DURATION_MS = 1200;
/** How far the core swells at the peak of a breath, as a fraction of its size. */
const BREATHE_SCALE_GAIN = 0.06;
/** `withRepeat` runs forever when the count is negative. */
const INFINITE_REPEAT = -1;

/**
 * Drives the generating showpiece: one shared value spins the orbit and the
 * ring in opposite directions, a second breathes the core.
 *
 * Two drivers rather than three animated styles each owning one, because the
 * orbit and the ring must stay in lockstep — reading the same `spin` value is
 * what guarantees they never drift apart over a long generation.
 */
export const useGeneratingAnimation = (): GeneratingAnimationResult => {
  const spin = useSharedValue(ValueConstants.zero);
  const breathe = useSharedValue(ValueConstants.zero);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(AnimationConstants.progressMax, {
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
      }),
      INFINITE_REPEAT,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(AnimationConstants.progressMax, {
          duration: BREATHE_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(ValueConstants.zero, {
          duration: BREATHE_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      INFINITE_REPEAT,
    );
  }, [spin, breathe]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * FULL_TURN_DEG}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * -FULL_TURN_DEG}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: AnimationConstants.progressMax + breathe.value * BREATHE_SCALE_GAIN }],
  }));

  return { orbitStyle, ringStyle, coreStyle };
};

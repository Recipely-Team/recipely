import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { ValueConstants } from '@core/constants';
import { isWeb } from '@infrastructure/constants/platform';
import { RISE_BEZIER } from '@presentation/base/widgets/launch-campaign/launch-campaign-geometry';

const RISE_EASING = Easing.bezier(...RISE_BEZIER);

/**
 * Fades a view in while it rises `offset` dp into place, after `delayMs`. With `isStill` it starts in place.
 *
 * @remarks
 * - **Returns a style**, so the caller just spreads it onto an `Animated.View`.
 */
export const useRiseIn = (
  delayMs: number,
  durationMs: number,
  offset: number,
  isStill: boolean,
): { opacity: Animated.Value; transform: { translateY: Animated.AnimatedInterpolation<number> }[] } => {
  const [progress] = useState(() => new Animated.Value(isStill ? ValueConstants.one : ValueConstants.zero));

  useEffect(() => {
    if (isStill) {
      progress.setValue(ValueConstants.one);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: ValueConstants.one,
      delay: delayMs,
      duration: durationMs,
      easing: RISE_EASING,
      useNativeDriver: !isWeb(),
    });
    animation.start();
    return () => animation.stop();
  }, [delayMs, durationMs, isStill, progress]);

  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [ValueConstants.zero, ValueConstants.one], outputRange: [offset, ValueConstants.zero] }) }],
  };
};

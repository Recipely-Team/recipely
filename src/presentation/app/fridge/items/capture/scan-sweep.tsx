import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { colorAlphas, durations } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface ScanSweepProps {
  /** The tile's height; the band travels from above it to below it. */
  height: number;
}

/** The band is a quarter of the tile. */
const BAND_SHARE = 0.25;

/**
 * The scanning band over the photo being read: a `primary` gradient a quarter
 * of the tile high, sweeping top to bottom every 1.1 s. Still under reduced motion.
 */
export const ScanSweep = ({ height }: ScanSweepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const reduceMotion = useReducedMotion();
  const band = height * BAND_SHARE;
  const progress = useSharedValue(ValueConstants.zero);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(withTiming(ValueConstants.one, { duration: durations.pulse, easing: Easing.linear }), ValueConstants.minusOne);
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -band + progress.value * (height + band) }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.band, { height: band }, style]}>
      <LinearGradient
        colors={[colors.backgroundClear, colors.primary + colorAlphas.medium, colors.backgroundClear]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    top: ValueConstants.zero,
  },
});

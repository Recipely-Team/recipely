import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BrandColors, opacities } from '@presentation/base/theme';
import { campaignSizes } from '@presentation/base/widgets/launch-campaign/launch-campaign-sizes';
import { ValueConstants } from '@core/constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCUMFERENCE = ValueConstants.two * Math.PI * campaignSizes.ringRadius;
const CENTRE = campaignSizes.ringSize / ValueConstants.two;

export interface CountdownRingProps {
  /** How long the ring takes to empty; `null` holds it full (reduced motion, or not started yet). */
  durationMs: number | null;
  onDone: () => void;
}

/** The Skip button's ring: empties clockwise from 12 o'clock, then calls `onDone`. Decorative. */
export const CountdownRing = ({ durationMs, onDone }: CountdownRingProps): React.JSX.Element => {
  const [offset] = useState(() => new Animated.Value(ValueConstants.zero));

  useEffect(() => {
    if (durationMs === null) return undefined;
    const animation = Animated.timing(offset, {
      toValue: CIRCUMFERENCE,
      duration: durationMs,
      easing: Easing.linear,
      // JS driver: an SVG stroke offset is not a native-driver prop.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, [durationMs, offset, onDone]);

  return (
    <View style={styles.rotated} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={campaignSizes.ringSize} height={campaignSizes.ringSize}>
      <Circle cx={CENTRE} cy={CENTRE} r={campaignSizes.ringRadius} stroke={BrandColors.white} strokeOpacity={opacities.scrimStrong} strokeWidth={campaignSizes.ringStroke} fill="none" />
      <AnimatedCircle
        cx={CENTRE}
        cy={CENTRE}
        r={campaignSizes.ringRadius}
        stroke={BrandColors.white}
        strokeWidth={campaignSizes.ringStroke}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        fill="none"
      />
    </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  rotated: { transform: [{ rotate: '-90deg' }] },
});

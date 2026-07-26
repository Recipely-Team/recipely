import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AnimationConstants } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

const RISE_DISTANCE = 14;
const FLOAT_DISTANCE = 7;
const ENTER_DURATION_MS = 520;
const FLOAT_HALF_DURATION_MS = 2000;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
// cubic-bezier(.2,.7,.3,1) — the prototype's `obRise` easing.
const ENTER_EASING = Easing.bezier(0.2, 0.7, 0.3, 1);

export interface OnboardingRevealProps {
  children: ReactNode;
  /** Replays the entrance when it flips false→true; false holds the hidden state. */
  active?: boolean;
  /** Stagger, in ms, before this element rises in. */
  delay?: number;
  /** Adds a gentle, continuous vertical float once revealed (the timer ring). */
  float?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fade-and-rise entrance (the prototype's `obRise`) with an optional continuous
 * float (`obFloat`). Honors the OS "reduce motion" setting by rendering the
 * content statically. `active` lets the mobile carousel replay a slide's
 * entrance each time it scrolls back into view.
 */
export const OnboardingReveal = ({
  children,
  active = true,
  delay = ValueConstants.zero,
  float = false,
  style,
}: OnboardingRevealProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(AnimationConstants.progressMin)).current;
  const floatValue = useRef(new Animated.Value(AnimationConstants.progressMin)).current;

  useEffect(() => {
    if (reducedMotion) return;
    if (!active) {
      progress.setValue(AnimationConstants.progressMin);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: AnimationConstants.progressMax,
      duration: ENTER_DURATION_MS,
      delay,
      easing: ENTER_EASING,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [active, delay, progress, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !float) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: AnimationConstants.progressMax,
          duration: FLOAT_HALF_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(floatValue, {
          toValue: AnimationConstants.progressMin,
          duration: FLOAT_HALF_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, floatValue, reducedMotion]);

  if (reducedMotion) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const riseY = progress.interpolate({
    inputRange: [...AnimationConstants.progressRange],
    outputRange: [RISE_DISTANCE, ValueConstants.zero],
  });
  const floatY = floatValue.interpolate({
    inputRange: [...AnimationConstants.progressRange],
    outputRange: [ValueConstants.zero, -FLOAT_DISTANCE],
  });
  const translateY = float ? Animated.add(riseY, floatY) : riseY;

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

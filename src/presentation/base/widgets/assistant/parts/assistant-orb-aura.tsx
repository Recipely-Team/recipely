import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, colorAlphas, opacities, radii } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** Two rings and three points, each starting a fraction of a cycle after the last. */
const RINGS = [ValueConstants.zero, 0.5];
const POINTS = [ValueConstants.zero, 0.33, 0.66];
const FULL_TURN = '360deg';

export interface AssistantOrbAuraProps {
  isSpeaking: boolean;
}

/**
 * What a live orb wears: expanding rings and points orbiting it.
 *
 * @remarks
 * - **It only exists while the session can hear.** The whole job of this layer
 *   is to say "this is on" from across a room, so drawing it at any other time
 *   would be saying something untrue.
 * - **Everything runs faster while the assistant speaks**, which is the design's
 *   way of separating "listening to you" from "talking to you" without a word.
 * - **Every animation is a transform or an opacity**, so the native driver
 *   carries all of it — this sits on the screen for the whole of a session and
 *   must not compete with decoding audio.
 */
export const AssistantOrbAura = ({ isSpeaking }: AssistantOrbAuraProps): React.JSX.Element => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const ring = useRef(new Animated.Value(ValueConstants.zero)).current;
  const orbit = useRef(new Animated.Value(ValueConstants.zero)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const spin = (value: Animated.Value, duration: number): Animated.CompositeAnimation =>
      Animated.loop(
        Animated.timing(value, {
          toValue: ValueConstants.one,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

    const rings = spin(ring, isSpeaking ? assistantMetrics.orbSpeakingRingMs : assistantMetrics.orbRingMs);
    const points = spin(orbit, isSpeaking ? assistantMetrics.orbSpeakingOrbitMs : assistantMetrics.orbOrbitMs);
    rings.start();
    points.start();
    return () => {
      rings.stop();
      points.stop();
    };
  }, [ring, orbit, isSpeaking, reduceMotion]);

  const at = (value: Animated.Value, offset: number): Animated.AnimatedInterpolation<number> =>
    value.interpolate({
      inputRange: [ValueConstants.zero, ValueConstants.one],
      outputRange: [offset, offset + ValueConstants.one],
    });

  return (
    <View style={styles.layer} pointerEvents="none">
      {RINGS.map((offset) => (
        <Animated.View
          key={offset}
          style={[
            styles.ring,
            {
              borderColor: colors.primary + colorAlphas.medium,
              opacity: at(ring, offset).interpolate({
                inputRange: [ValueConstants.zero, ValueConstants.one],
                outputRange: [opacities.scrimStrong, ValueConstants.zero],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: at(ring, offset).interpolate({
                    inputRange: [ValueConstants.zero, ValueConstants.one],
                    outputRange: [ValueConstants.one, assistantMetrics.orbRingGrowth],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {POINTS.map((offset, index) => (
        <Animated.View
          key={offset}
          style={[
            styles.orbit,
            {
              transform: [
                {
                  rotate: at(orbit, offset).interpolate({
                    inputRange: [ValueConstants.zero, ValueConstants.one],
                    outputRange: ['0deg', FULL_TURN],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              index === ValueConstants.zero ? styles.leadPoint : styles.point,
              {
                backgroundColor: colors.primary,
                opacity: index === ValueConstants.zero ? opacities.onMediaFaint : opacities.disabled,
              },
            ]}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  // Pinned throughout: rings and points are shapes, not boxes with text.
  ring: {
    position: 'absolute',
    width: assistantMetrics.orbRing,
    height: assistantMetrics.orbRing,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
  },
  orbit: {
    position: 'absolute',
    width: assistantMetrics.orbOrbit,
    height: assistantMetrics.orbOrbit,
    alignItems: 'center',
  },
  // Centred ON the orbit's edge rather than hanging inside it.
  leadPoint: {
    width: assistantMetrics.orbLeadPoint,
    height: assistantMetrics.orbLeadPoint,
    borderRadius: radii.round,
    marginTop: -assistantMetrics.orbLeadPoint / ValueConstants.two,
  },
  point: {
    width: assistantMetrics.orbPoint,
    height: assistantMetrics.orbPoint,
    borderRadius: radii.round,
    marginTop: -assistantMetrics.orbPoint / ValueConstants.two,
  },
});

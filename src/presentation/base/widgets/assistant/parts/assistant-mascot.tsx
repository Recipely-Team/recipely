import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { mascotGeometry } from '@presentation/base/widgets/assistant/assistant-mascot-geometry';
import { ValueConstants } from '@core/constants';

// The blink is a property of the shape, not a transform of a layer: SVG groups
// take no `style`, and squashing the eye is what reads as a blink anyway.
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export interface AssistantMascotProps {
  size: number;
  status: AssistantStatusType;
}

/**
 * The chef the user actually talks to.
 *
 * @remarks
 * - **The face is the status indicator.** A coloured dot told the user the
 *   session's state in a vocabulary they had to learn; a chef that bobs while
 *   listening and opens its mouth while speaking says the same thing in one
 *   they already have. The dot survives elsewhere for the states a face cannot
 *   carry — connecting, out of minutes.
 * - **Every animation is a transform**, so `useNativeDriver` holds and the
 *   mascot keeps moving while the JS thread is busy dispatching a tool call —
 *   which is exactly when it is on screen.
 * - **It holds still under Reduce Motion.** The blink and the bob are
 *   decoration; the mouth is not, so that one stays: it is the only signal that
 *   distinguishes the assistant speaking from the assistant waiting.
 */
export const AssistantMascot = ({ size, status }: AssistantMascotProps): React.JSX.Element => {
  const speaking = status === AssistantStatus.Speaking;
  const listening = status === AssistantStatus.Listening;
  const reduceMotion = useReduceMotion();

  const blink = useRef(new Animated.Value(mascotGeometry.eyes.r)).current;
  const bob = useRef(new Animated.Value(ValueConstants.zero)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(assistantMetrics.blinkIntervalMs),
        Animated.timing(blink, {
          toValue: mascotGeometry.eyeClosed,
          duration: assistantMetrics.blinkDurationMs,
          useNativeDriver: false,
        }),
        Animated.timing(blink, {
          toValue: mascotGeometry.eyes.r,
          duration: assistantMetrics.blinkDurationMs,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !listening) {
      bob.setValue(ValueConstants.zero);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: ValueConstants.one,
          duration: assistantMetrics.bobDurationMs / ValueConstants.two,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: ValueConstants.zero,
          duration: assistantMetrics.bobDurationMs / ValueConstants.two,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, listening, reduceMotion]);

  const translateY = bob.interpolate({
    inputRange: [ValueConstants.zero, ValueConstants.one],
    outputRange: [ValueConstants.zero, -assistantMetrics.bobTravel],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${mascotGeometry.viewBox} ${mascotGeometry.viewBox}`}>
      <Defs>
        <LinearGradient id="assistantMascotFace" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mascotGeometry.faceTop} />
          <Stop offset="1" stopColor={mascotGeometry.faceBottom} />
        </LinearGradient>
      </Defs>

      <Circle {...mascotGeometry.face} fill="url(#assistantMascotFace)" />

        <Ellipse
          cx={mascotGeometry.cheeks.left}
          cy={mascotGeometry.cheeks.cy}
          rx={mascotGeometry.cheeks.rx}
          ry={mascotGeometry.cheeks.ry}
          fill={mascotGeometry.cheek}
          opacity={mascotGeometry.cheekOpacity}
        />
        <Ellipse
          cx={mascotGeometry.cheeks.right}
          cy={mascotGeometry.cheeks.cy}
          rx={mascotGeometry.cheeks.rx}
          ry={mascotGeometry.cheeks.ry}
          fill={mascotGeometry.cheek}
          opacity={mascotGeometry.cheekOpacity}
        />

        <AnimatedEllipse
          cx={mascotGeometry.eyes.left}
          cy={mascotGeometry.eyes.cy}
          rx={mascotGeometry.eyes.r}
          ry={blink}
          fill={mascotGeometry.eye}
        />
        <AnimatedEllipse
          cx={mascotGeometry.eyes.right}
          cy={mascotGeometry.eyes.cy}
          rx={mascotGeometry.eyes.r}
          ry={blink}
          fill={mascotGeometry.eye}
        />

        {speaking ? (
          <Ellipse {...mascotGeometry.mouth} fill={mascotGeometry.mouthFill} />
        ) : (
          <Path
            d={mascotGeometry.smile}
            stroke={mascotGeometry.mouthFill}
            strokeWidth={mascotGeometry.smileWidth}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {mascotGeometry.hatPuffs.map((puff) => (
          <Circle key={`${puff.cx}-${puff.cy}`} {...puff} fill={mascotGeometry.hat} />
        ))}
        <Rect {...mascotGeometry.hatBand} fill={mascotGeometry.hat} />
        <Rect {...mascotGeometry.hatBand} fill={mascotGeometry.bandShade} opacity={mascotGeometry.bandShadeOpacity} />
      </Svg>
    </Animated.View>
  );
};

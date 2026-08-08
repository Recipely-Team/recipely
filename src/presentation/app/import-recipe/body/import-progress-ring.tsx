import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  radii,
  iconSizes,
  borderWidths,
  opacities,
  durations,
  BrandColors,
} from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface ImportProgressRingProps {
  /** 0..1 — how much of the ring is drawn. */
  progress: number;
  /** Swaps the ring to the success hue and shows the check badge. */
  done: boolean;
}

const RING_SIZE = 152;
const RING_CENTER = RING_SIZE / ValueConstants.two;
const RING_RADIUS = 62;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const DISH_INSET = 18;
const RIM_WIDTH = 3;
const CHECK_BADGE = 38;
const CHECK_RING = 4;
const BLOOM_SPREAD = 10;
/** The bloom breathes; it never fully stills, so a queued job still reads as alive. */
const BLOOM_MIN_SCALE = 0.96;
const BLOOM_MAX_SCALE = 1.04;

const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.one };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.zero };
const INSTAGRAM_STOPS = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientWarm,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;

/**
 * The waiting showpiece: an Instagram-gradient ring wound around the dish.
 *
 * @remarks
 * - **The gradient IS the provenance.** This screen used to carry a "From
 *   Instagram" chip to say where the reel came from; the gradient says it
 *   without a label, in the one place the eye is already looking.
 * - **The ring is the JOB's progress, not a timer** — it moves when the backend
 *   says the job moved. Only the bloom is decorative, which is the honest
 *   division: something has to say "still working" through the minutes when
 *   nothing changes.
 * - The design's bloom is a CSS blur, which React Native has no equivalent for.
 *   A low-opacity gradient disc breathing behind the ring reads as the same
 *   glow without pulling in a blur view for one decorative element.
 */
export const ImportProgressRing = ({ progress, done }: ImportProgressRingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const bloom = useSharedValue(ValueConstants.zero);

  useEffect(() => {
    bloom.value = withRepeat(
      withTiming(ValueConstants.one, { duration: durations.pulse, easing: Easing.inOut(Easing.ease) }),
      -ValueConstants.one,
      true,
    );
  }, [bloom]);

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: BLOOM_MIN_SCALE + bloom.value * (BLOOM_MAX_SCALE - BLOOM_MIN_SCALE) }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.bloom, bloomStyle]}>
        <LinearGradient
          colors={[...INSTAGRAM_STOPS]}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.bloomFill}
        />
      </Animated.View>

      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
        <Defs>
          <SvgGradient id="igRing" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor={BrandColors.instagramGradientStart} />
            <Stop offset="30%" stopColor={BrandColors.instagramGradientWarm} />
            <Stop offset="62%" stopColor={BrandColors.instagramGradientMid} />
            <Stop offset="100%" stopColor={BrandColors.instagramGradientEnd} />
          </SvgGradient>
        </Defs>
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          stroke={colors.skeleton}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          stroke={done ? colors.success : 'url(#igRing)'}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (ValueConstants.one - progress)}
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
      </Svg>

      <LinearGradient
        colors={[...INSTAGRAM_STOPS]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.rim}
      >
        <View style={[styles.dish, { borderColor: colors.background }]}>
          <LinearGradient
            colors={[...INSTAGRAM_STOPS]}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={styles.dishFill}
          >
            <Ionicons name="restaurant-outline" size={iconSizes.huge} color={BrandColors.white} />
          </LinearGradient>
        </View>
      </LinearGradient>

      {done ? (
        <View style={[styles.check, { backgroundColor: colors.success, borderColor: colors.background }]}>
          <Ionicons name="checkmark" size={iconSizes.xl} color={colors.primaryText} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
  },
  bloom: {
    position: 'absolute',
    top: -BLOOM_SPREAD,
    left: -BLOOM_SPREAD,
    right: -BLOOM_SPREAD,
    bottom: -BLOOM_SPREAD,
    borderRadius: RING_SIZE,
    overflow: 'hidden',
    opacity: opacities.scrimStrong,
  },
  bloomFill: {
    flex: ValueConstants.one,
  },
  ring: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
  },
  rim: {
    position: 'absolute',
    top: DISH_INSET,
    left: DISH_INSET,
    right: DISH_INSET,
    bottom: DISH_INSET,
    borderRadius: RING_SIZE,
    padding: RIM_WIDTH,
  },
  dish: {
    flex: ValueConstants.one,
    borderRadius: RING_SIZE,
    overflow: 'hidden',
    borderWidth: borderWidths.thin,
  },
  dishFill: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
    width: CHECK_BADGE,
    height: CHECK_BADGE,
    borderRadius: radii.round,
    borderWidth: CHECK_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

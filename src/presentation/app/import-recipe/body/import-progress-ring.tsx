import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii, iconSizes, borderWidths, opacities, durations } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface ImportProgressRingProps {
  /** 0..1 — how much of the ring is drawn. */
  progress: number;
  /** Swaps the ring to the success hue and shows the check badge. */
  done: boolean;
}

const RING_SIZE = 148;
const RING_CENTER = RING_SIZE / ValueConstants.two;
const RING_RADIUS = 54;
const RING_STROKE = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_INSET = 22;
const PULSE_INSET = 8;
const CHECK_BADGE = 36;
const CHECK_RING = 4;
/** The pulse breathes out from just under the ring and fades as it grows. */
const PULSE_MIN_SCALE = 0.94;
const PULSE_MAX_SCALE = 1.14;

/**
 * The waiting showpiece: a progress ring around the reel's place, with a slow
 * pulse behind it so a queued job still reads as alive.
 *
 * @remarks
 * The ring is the JOB's progress, not a timer — it moves when the backend says
 * the job moved. Only the pulse is decorative, which is the honest division:
 * something has to say "still working" during the minutes when nothing changes.
 */
export const ImportProgressRing = ({ progress, done }: ImportProgressRingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const pulse = useSharedValue(ValueConstants.zero);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(ValueConstants.one, { duration: durations.pulse, easing: Easing.out(Easing.ease) }),
      -ValueConstants.one,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (ValueConstants.one - pulse.value) * opacities.scrimStrong,
    transform: [{ scale: PULSE_MIN_SCALE + pulse.value * (PULSE_MAX_SCALE - PULSE_MIN_SCALE) }],
  }));

  const ringColor = done ? colors.success : colors.primary;

  return (
    <View style={styles.root}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
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
          stroke={ringColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (ValueConstants.one - progress)}
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
      </Svg>

      <Animated.View style={[styles.pulse, { borderColor: colors.primary }, pulseStyle]} />

      <View style={[styles.core, { backgroundColor: colors.skeleton }]}>
        <Ionicons name="restaurant-outline" size={iconSizes.huge} color={colors.textMuted} />
      </View>

      {done ? (
        <View
          style={[
            styles.check,
            { backgroundColor: colors.success, borderColor: colors.background },
          ]}
        >
          <Ionicons name="checkmark" size={iconSizes.lg} color={colors.primaryText} />
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
  ring: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
  },
  pulse: {
    position: 'absolute',
    top: PULSE_INSET,
    left: PULSE_INSET,
    right: PULSE_INSET,
    bottom: PULSE_INSET,
    borderRadius: RING_SIZE,
    borderWidth: borderWidths.thin,
  },
  core: {
    position: 'absolute',
    top: INNER_INSET,
    left: INNER_INSET,
    right: INNER_INSET,
    bottom: INNER_INSET,
    borderRadius: RING_SIZE,
    overflow: 'hidden',
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

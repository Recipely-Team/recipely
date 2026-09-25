import { useEffect, useId } from 'react';
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
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';
import { ImportDish, type ImportDishType } from '@presentation/app/import-recipe/model/import-dish';

export interface ImportProgressRingProps {
  /** 0..1 — how much of the ring is drawn. */
  progress: number;
  /** Swaps the ring to the success hue and shows the check badge. */
  done: boolean;
  look: ImportLook;
  /** A web page shows the site's globe and a file its page; a video keeps the dish. */
  dish: ImportDishType;
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

/** The globe inside a web import's dish, as the prototype draws it. */
const WEB_MARK = 44;

const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.one };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.zero };

/**
 * The waiting showpiece: a ring in the source platform's colours wound around the dish.
 *
 * @remarks
 * - **The gradient IS the provenance.** This screen used to carry a "From
 *   Instagram" chip to say where the reel came from; the gradient says it
 *   without a label, in the one place the eye is already looking. A web page
 *   has no platform to credit, so it wears the app's own colours.
 * - **The ring is the JOB's progress, not a timer** — it moves when the backend
 *   says the job moved. Only the bloom is decorative, which is the honest
 *   division: something has to say "still working" through the minutes when
 *   nothing changes.
 * - The design's bloom is a CSS blur, which React Native has no equivalent for.
 *   A low-opacity gradient disc breathing behind the ring reads as the same
 *   glow without pulling in a blur view for one decorative element.
 */
export const ImportProgressRing = ({ progress, done, look, dish }: ImportProgressRingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const ringId = `import-ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
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
          colors={[...look.gradient]}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.bloomFill}
        />
      </Animated.View>

      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
        <Defs>
          <SvgGradient id={ringId} x1="0" y1="1" x2="1" y2="0">
            {look.gradient.map((color, i) => (
              <Stop key={`${color}-${i}`} offset={look.ringStops[i] ?? ValueConstants.one} stopColor={color} />
            ))}
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
          stroke={done ? colors.success : `url(#${ringId})`}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (ValueConstants.one - progress)}
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
      </Svg>

      <LinearGradient
        colors={[...look.gradient]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.rim}
      >
        <View style={[styles.dish, { borderColor: colors.background }]}>
          <LinearGradient
            colors={[...look.gradient]}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={styles.dishFill}
          >
            {dish === ImportDish.Globe ? (
              <ProvenanceGlyph mark={ProvenanceMark.Web} size={WEB_MARK} tint={colors.primaryText} />
            ) : dish === ImportDish.Document ? (
              <Ionicons name="document-text-outline" size={iconSizes.huge} color={colors.primaryText} />
            ) : (
              <Ionicons name="restaurant-outline" size={iconSizes.huge} color={BrandColors.white} />
            )}
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
  // The bloom is positioned OUTSIDE this box — `BLOOM_SPREAD` past every edge —
  // so the box alone understates what the ring occupies by 10pt on each side.
  // The screen's own `spacing.md` gaps are 12, which left the glow 2pt from the
  // safe-area edge above it and 2pt from the status pill below: the ring read as
  // stuck to the top of the screen and the pill as stuck to the ring. The margin
  // is what makes the reserved space match the drawn thing, so every gap the
  // layout asks for is the gap that appears.
  root: {
    width: RING_SIZE,
    height: RING_SIZE,
    margin: BLOOM_SPREAD,
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

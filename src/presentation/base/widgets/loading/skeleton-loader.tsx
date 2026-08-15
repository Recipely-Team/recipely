import { useEffect } from 'react';
import { isWeb } from '@infrastructure/constants/platform';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii, opacities } from '@presentation/base/theme';

/**
 * A pixel count or a percentage — the two the shimmer can actually be given.
 * Narrower than RN's `DimensionValue` (which also admits `auto` and `null`)
 * because this is the one type both paths must satisfy: an RN style on native
 * and a DOM `CSSProperties` on the web. Anything wider needs a cast on one
 * side or the other, and a percentage is what lets the block fill a
 * ratio-sized box.
 */
type SkeletonSizeType = number | `${number}%`;

export interface SkeletonLoaderProps {
  width: SkeletonSizeType;
  height: SkeletonSizeType;
  borderRadius?: number;
  style?: ViewStyle;
}

const SHIMMER_KEYFRAMES_ID = 'recipely-shimmer';
const SHIMMER_SWEEP_WIDTH = 120;

/** Injects the shimmer keyframes into the document head once (web only). */
const ensureShimmerKeyframes = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = SHIMMER_KEYFRAMES_ID;
  style.textContent =
    '@keyframes recipely-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
  document.head.appendChild(style);
};

/**
 * Shimmer placeholder block used while content is loading.
 *
 * Native animates a moving highlight block via Reanimated. On the web that
 * reads as a "mobile" effect, so the web path instead sweeps a CSS gradient via
 * `background-position` — the idiomatic web loading shimmer. Both paths live in
 * one file so resolution never falls back to the native effect on the web.
 */
export const SkeletonLoader = ({
  width,
  height,
  borderRadius = radii.md,
  style,
}: SkeletonLoaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  // Hooks run on every platform (rules of hooks); only native consumes them.
  const translateX = useSharedValue(-SHIMMER_SWEEP_WIDTH);

  useEffect(() => {
    if (isWeb()) return;
    translateX.value = withRepeat(
      withTiming(SHIMMER_SWEEP_WIDTH, { duration: 1200 }),
      -1,
      false,
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (isWeb()) {
    ensureShimmerKeyframes();
    return (
      <div
        style={{
          width,
          height,
          borderRadius,
          background: `linear-gradient(90deg, ${colors.skeleton} 25%, ${colors.skeletonHighlight} 50%, ${colors.skeleton} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'recipely-shimmer 1.4s linear infinite',
          ...(style as unknown as React.CSSProperties),
        }}
      />
    );
  }

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.skeleton, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.skeletonHighlight, width: SHIMMER_SWEEP_WIDTH, opacity: opacities.disabledFaint },
          shimmerStyle,
        ]}
      />
    </Animated.View>
  );
};

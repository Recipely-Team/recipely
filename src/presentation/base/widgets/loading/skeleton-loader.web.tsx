import type { ViewStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii } from '@presentation/base/theme';

export interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SHIMMER_KEYFRAMES_ID = 'recipely-shimmer';

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
 * Web shimmer placeholder. The native build animates a moving highlight block
 * via Reanimated; on the web that reads as a "mobile" effect, so the web
 * variant instead sweeps a CSS gradient via `background-position` — the
 * idiomatic web loading shimmer.
 */
export const SkeletonLoader = ({
  width,
  height,
  borderRadius = radii.md,
  style,
}: SkeletonLoaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
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
};

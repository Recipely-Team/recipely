import type { ViewStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii } from '@presentation/base/theme';
import { WebShimmer } from '@presentation/base/widgets/loading/web-shimmer';

export interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}



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
  WebShimmer.ensureKeyframes();

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        ...WebShimmer.style(colors.skeleton, colors.skeletonHighlight),
        ...(style as unknown as React.CSSProperties),
      }}
    />
  );
};

import { Platform, type ViewStyle } from 'react-native';
import { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
import { scale } from '@presentation/base/theme/tokens/scale';
import { ValueConstants } from '@core/constants';

/**
 * The cast shadow at each elevation step: vertical offset, blur radius and
 * alpha. Higher cards sit further from the surface, so they drop further, blur
 * wider and darken more — the three move together or the ladder stops reading
 * as depth.
 */
const CAST = {
  sm: { offsetY: 1, blur: 4, alpha: 0.08 },
  md: { offsetY: 4, blur: 12, alpha: 0.12 },
  lg: { offsetY: 8, blur: 24, alpha: 0.16 },
} as const;

/** Android renders depth as a native elevation step, not as a drawn shadow. */
const ELEVATION = { sm: 2, md: 4, lg: 8 } as const;

const cast = ({
  offsetY,
  blur,
  alpha,
}: {
  offsetY: number;
  blur: number;
  alpha: number;
}): ViewStyle => ({
  shadowColor: BrandColors.black,
  shadowOffset: { width: ValueConstants.zero, height: scale(offsetY) },
  shadowOpacity: alpha,
  shadowRadius: scale(blur),
});

/**
 * Elevation ladder. `Platform.select` keeps Android on native elevation — far
 * cheaper to render than a drawn shadow — while iOS and web get the real cast.
 */
export const shadows = {
  sm: Platform.select<ViewStyle>({ android: { elevation: ELEVATION.sm }, default: cast(CAST.sm) }) ?? {},
  md: Platform.select<ViewStyle>({ android: { elevation: ELEVATION.md }, default: cast(CAST.md) }) ?? {},
  lg: Platform.select<ViewStyle>({ android: { elevation: ELEVATION.lg }, default: cast(CAST.lg) }) ?? {},
} as const;

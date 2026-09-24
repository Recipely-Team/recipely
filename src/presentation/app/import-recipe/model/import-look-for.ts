import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { BrandColors, type ThemeColors } from '@presentation/base/theme';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';

const INSTAGRAM_GRADIENT = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientWarm,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;
const INSTAGRAM_RING_STOPS = [0, 0.3, 0.62, 1] as const;
const TWO_STOP_RING = [0, 1] as const;

/**
 * Which colours the importing screen wears, decided by the link — never chosen.
 *
 * @remarks
 * - **A video wears Instagram's colours**, because the colours are the
 *   provenance cue on this screen. TikTok has no look of its own yet: its
 *   links are not importable while TikTok blocks the worker.
 * - **A web page wears the app's own palette.** There is no platform to credit,
 *   and borrowing a site's colours would credit one we never asked.
 */
export const importLookFor = (platform: SourcePlatformType, colors: ThemeColors): ImportLook => {
  if (platform === SourcePlatform.Web) {
    const gradient = [colors.primaryGradientStart, colors.primaryGradientEnd] as const;
    return {
      gradient,
      ringStops: TWO_STOP_RING,
      accent: colors.primary,
      pill: [colors.primary, colors.primary],
      pillText: colors.primaryText,
    };
  }
  return {
    gradient: INSTAGRAM_GRADIENT,
    ringStops: INSTAGRAM_RING_STOPS,
    accent: BrandColors.instagramGradientMid,
    pill: INSTAGRAM_GRADIENT,
    pillText: BrandColors.white,
  };
};

import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { BrandColors, type ThemeColors } from '@presentation/base/theme';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';
import { appImportLook } from '@presentation/app/import-recipe/model/app-import-look';
import { ValueConstants } from '@core/constants';

const INSTAGRAM_GRADIENT = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientWarm,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;
const TIKTOK_GRADIENT = [BrandColors.tiktokCyan, BrandColors.tiktokRed] as const;
const INSTAGRAM_RING_STOPS = [ValueConstants.zero, 0.3, 0.62, ValueConstants.one] as const;
const TWO_STOP_RING = [ValueConstants.zero, ValueConstants.one] as const;

/**
 * Which colours the importing screen wears, decided by the link — never chosen.
 *
 * @remarks
 * - **Instagram and TikTok wear their own colours**, because the colours are
 *   the provenance cue on this screen.
 * - **A web page wears the app's own palette.** There is no platform to credit,
 *   and borrowing a site's colours would credit one we never asked.
 * - **Facebook and YouTube wear it too**, until the prototype draws them a look
 *   of their own: falling through to Instagram's gradient credited the wrong
 *   platform on every Facebook or YouTube import.
 */
export const importLookFor = (platform: SourcePlatformType, colors: ThemeColors): ImportLook => {
  if (platform === SourcePlatform.TikTok) {
    // A black pill: white text on TikTok's cyan would be unreadable.
    return {
      gradient: TIKTOK_GRADIENT,
      ringStops: TWO_STOP_RING,
      accent: BrandColors.tiktokRed,
      pill: [BrandColors.tiktokNote, BrandColors.tiktokNote],
      pillText: BrandColors.white,
    };
  }
  if (platform !== SourcePlatform.Instagram) return appImportLook(colors);
  return {
    gradient: INSTAGRAM_GRADIENT,
    ringStops: INSTAGRAM_RING_STOPS,
    accent: BrandColors.instagramGradientMid,
    pill: INSTAGRAM_GRADIENT,
    pillText: BrandColors.white,
  };
};

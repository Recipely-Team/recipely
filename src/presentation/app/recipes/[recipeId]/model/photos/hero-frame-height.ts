import { aspectRatios, layoutSizes, mediaSizes } from '@presentation/base/theme';
import { PhotoViewerVariant, type PhotoViewerVariantType } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';

/**
 * The hero frame's height: 4:3 of its width, capped.
 *
 * @remarks
 * - **The phone cap is a share of the viewport** as well as a length, so a
 *   landscape phone keeps the recipe itself above the fold.
 * - **Once capped the frame is wider than 4:3.** That is expected; the
 *   portrait rule reads the measured frame, not this ratio.
 */
export const heroFrameHeight = (
  width: number,
  variant: PhotoViewerVariantType,
  viewportHeight: number,
): number => {
  const cap =
    variant === PhotoViewerVariant.Framed
      ? mediaSizes.heroImageHeightWeb
      : Math.min(viewportHeight * layoutSizes.heroViewportShare, mediaSizes.heroImageHeightMax);
  return Math.round(Math.min(width / aspectRatios.hero, cap));
};

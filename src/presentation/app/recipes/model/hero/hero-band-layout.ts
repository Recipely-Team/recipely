import { aspectRatios, layoutSizes, spacing } from '@presentation/base/theme';

/**
 * How the home hero band divides its width, and when it grows a third column.
 *
 * @remarks
 * - **Proportion, never a pinned size.** The band states its split in flex
 *   weights and its shape in one ratio; every height in it follows. Two
 *   siblings that each carry a size will disagree — a ratio-sized featured card
 *   beside `minHeight`-sized minis left the row ragged along the bottom.
 * - **The cuisines take a SHARE, not the leftover.** The obvious version — let
 *   the hero size itself and give the cuisines whatever is left — collapses
 *   unpredictably, because the hero's own bound scales with viewport HEIGHT:
 *   a 1920x1080 window leaves 557px beside it but a 2560x1440 one leaves 170px,
 *   so a taller monitor would close the column. A fixed share cannot do that.
 * - **Size hierarchy, not position** (the Guardian / NYT card-grid pattern):
 *   the featured card is the largest block at every width, the minis and the
 *   cuisine column support it, and below the threshold the band collapses to a
 *   single editorial stack without reordering anything.
 */
export const HeroBandFlex = {
  featured: 5,
  mini: 3,
  cuisines: 3,
} as const;

/**
 * Width the cuisine column needs before it earns a place in the band.
 *
 * Deliberately high — the column only earns its place on a genuinely large
 * desktop window (~1535px and up), not on a laptop or a tablet. Three columns
 * at iPad width crowded the band; below this the band stays two columns and the
 * cuisines render as the horizontal strip underneath.
 */
const CUISINE_COLUMN_MIN = 400;

const totalFlex = (withCuisines: boolean): number =>
  HeroBandFlex.featured + HeroBandFlex.mini + (withCuisines ? HeroBandFlex.cuisines : 0);

/** Width one flex part is worth, once the inter-column gaps are removed. */
const partWidth = (bandWidth: number, withCuisines: boolean): number => {
  const gaps = spacing.sm2 * (withCuisines ? 2 : 1);
  return (bandWidth - gaps) / totalFlex(withCuisines);
};

/**
 * Whether the band has room for the cuisine column at this width. Asks what the
 * column would actually get rather than comparing the viewport to a magic
 * number, so the answer stays true if the split ever changes.
 */
export const bandFitsCuisines = (bandWidth: number): boolean =>
  partWidth(bandWidth, true) * HeroBandFlex.cuisines >= CUISINE_COLUMN_MIN;

/**
 * The height the band resolves to — the featured card's width over its ratio.
 *
 * Takes the split rather than re-deriving it: asking `bandFitsCuisines` here
 * let this disagree with {@link bandMaxWidth}, which is handed the flag, and the
 * two then described different bands.
 */
export const bandHeight = (bandWidth: number, withCuisines: boolean): number =>
  (partWidth(bandWidth, withCuisines) * HeroBandFlex.featured) / aspectRatios.heroWide;

/**
 * Ceiling for unusually short windows only.
 *
 * The band normally spans the full feed width, which is what keeps it aligned
 * with the banner and the recipe grid below. But a very wide, very short window
 * (1920x700) would hand 70% of the viewport to one card, so the band narrows
 * until its height is back under {@link layoutSizes.heroViewportShare}.
 *
 * It is expressed as a max WIDTH even though what we are limiting is height: a
 * max-height and an aspect ratio cannot both hold, and clamping the height is
 * what let the card drift into a 2.6:1 letterbox. Bounding the width bounds the
 * height through the ratio instead.
 */
export const bandMaxWidth = (viewportHeight: number, withCuisines: boolean): number => {
  const maxHeight = viewportHeight * layoutSizes.heroViewportShare;
  const featuredWidth = maxHeight * aspectRatios.heroWide;
  const gaps = spacing.sm2 * (withCuisines ? 2 : 1);
  return (featuredWidth * totalFlex(withCuisines)) / HeroBandFlex.featured + gaps;
};

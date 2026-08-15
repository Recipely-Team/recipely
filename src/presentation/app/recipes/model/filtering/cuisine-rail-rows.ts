import { avatarSizes, spacing } from '@presentation/base/theme';

/** Height above which the rail is allowed its third row. */
const TALL_VIEWPORT = 900;

const MAX_ROWS_TALL = 3;
const MAX_ROWS_SHORT = 2;

/** One chip is the avatar's width; the gap is the strip's own spacing. */
const CHIP_PITCH = avatarSizes.lg + spacing.lg;

/**
 * How many cuisine chips the rail shows before the rest are left to the sheet.
 *
 * @remarks
 * The chips wrap rather than scroll sideways: a horizontal rail needs an
 * affordance to say it continues, and a decorative one that does not scroll is
 * worse than none — which is exactly what shipped. Wrapping has no hidden
 * state, so nothing has to advertise it.
 *
 * Rows are capped rather than left to the content, or the catalogue would push
 * the recipes off the fold again; the cap is the whole point. The third row is
 * only allowed on a viewport tall enough to spend it.
 */
export const railChipCount = (contentWidth: number, viewportHeight: number): number => {
  const perRow = Math.max(1, Math.floor((contentWidth + spacing.lg) / CHIP_PITCH));
  const rows = viewportHeight >= TALL_VIEWPORT ? MAX_ROWS_TALL : MAX_ROWS_SHORT;
  return perRow * rows;
};

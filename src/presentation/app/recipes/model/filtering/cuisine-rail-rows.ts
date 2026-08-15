import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';
import { avatarSizes, spacing } from '@presentation/base/theme';

const MAX_ROWS_ROOMY = 3;
const MAX_ROWS_TIGHT = 2;

/** One chip is the avatar's width; the gap is the strip's own spacing. */
const CHIP_PITCH = avatarSizes.lg + spacing.lg;

/** The leading "All" chip rides the rail too, so the budget has to pay for it. */
const RESET_CHIP = 1;

/**
 * How many cuisine chips the rail shows before the rest are left to the sheet.
 *
 * @remarks
 * - **Wrapped, not scrolled.** A horizontal rail needs an affordance to say it
 *   continues, and the first cut shipped a chevron that did nothing at all.
 *   Rows have no hidden state, so nothing has to advertise them.
 * - **The cap is the whole point.** Uncapped, the catalogue grows back down the
 *   page and pushes the recipes off the fold, which is what the rail replaced.
 * - **The third row is earned by WIDTH as much as height.** Keying it to height
 *   alone gave a portrait iPad three rows it had no width for: twelve chips a
 *   row meant the budget wrapped to four rows and ate a third of the screen.
 * - The reset chip is counted, or the row that should have been the last one
 *   spills a single orphan onto a new line — which is exactly what it did.
 */
export const railChipCount = (
  contentWidth: number,
  viewportWidth: number,
  viewportHeight: number,
): number => {
  const perRow = Math.max(1, Math.floor((contentWidth + spacing.lg) / CHIP_PITCH));
  const roomy = viewportWidth >= BREAKPOINTS.wide && viewportHeight >= BREAKPOINTS.desktop;
  const rows = roomy ? MAX_ROWS_ROOMY : MAX_ROWS_TIGHT;
  return Math.max(1, perRow * rows - RESET_CHIP);
};

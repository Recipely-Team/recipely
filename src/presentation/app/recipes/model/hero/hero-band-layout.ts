import { BREAKPOINTS } from '@presentation/base/responsive/breakpoints';

/**
 * How the home hero row divides its width, from the wide-screen home design.
 *
 * @remarks
 * - **Three blocks, one row**: the featured recipe, the two runners-up stacked
 *   beside it, and the AI panel. Grow/basis pairs rather than plain weights,
 *   because each block has a width below which it stops being readable and the
 *   row should wrap rather than squeeze it.
 * - **The cuisines are NOT here.** They were, and it was wrong: a vertical list
 *   of forty items beside a photographic hero read as a form control, and it
 *   could only ever show a truncated seven. They are a full-width rail above
 *   the grid now, with the catalogue behind one button.
 * - **Wrapping is the collapse.** Below {@link aiPanelInRow} the AI panel takes
 *   a line of its own and switches to its row form — the design's band.
 *   Nothing reorders; the row simply wraps.
 */
export const HeroFlex = {
  featured: { grow: 2.5, basis: 520 },
  runners: { grow: 1.05, basis: 260 },
  ai: { grow: 1, basis: 300, max: 380 },
} as const;

/**
 * Whether the AI panel rides in the hero row as a third column, or sits under
 * it as a full-width band. Asked by the panel itself (to pick its form) and by
 * the row (for its height), so the two always agree.
 */
export const aiPanelInRow = (viewportWidth: number): boolean =>
  viewportWidth >= BREAKPOINTS.wide;

/**
 * The row's floor at each width, from the design's frames: 440 at 1920, 400 at
 * 1440, 340 at 1030, 300 below. A floor rather than a fixed height — the
 * featured card's own ratio can ask for more, and text must be able to grow.
 */
export const heroRowMinHeight = (viewportWidth: number): number => {
  if (viewportWidth >= BREAKPOINTS.wide) return 440;
  if (viewportWidth >= BREAKPOINTS.desktop) return 400;
  if (viewportWidth >= BREAKPOINTS.tablet) return 340;
  return 300;
};

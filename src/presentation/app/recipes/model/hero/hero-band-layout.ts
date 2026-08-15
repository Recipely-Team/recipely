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
 * - **Width only — the row states no height.** The featured card's ratio is the
 *   band's single source of shape and the other two blocks stretch to it. A
 *   per-breakpoint `minHeight` used to live here as well, and the two sizes
 *   disagreed: at 1200 the flex split hands the featured card ~538px, so its
 *   ratio asks for ~336, while the floor held the row at 440 and left a ~100px
 *   strip of dead space under all three cards.
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

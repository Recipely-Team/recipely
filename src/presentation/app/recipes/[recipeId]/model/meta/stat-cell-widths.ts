import { ValueConstants } from '@core/constants';
import { statGrid } from '@presentation/app/recipes/[recipeId]/model/meta/stat-grid';

const CENTI = 100;

/**
 * The width of each stat tile on a card measured at `cardWidth` — or `null`
 * before the card has been measured.
 *
 * @remarks
 * - **One row above the breakpoint, two columns at or below it**, judged on
 *   the card's outer width, as the prototype's container query does.
 * - **Tiles fill the inside of the border**, less a `gap`-wide divider between
 *   neighbours; the divider is the card's own colour showing through.
 * - **Larger system text counts as a narrower card.** At 1.5× text the four
 *   tiles stayed in one row and broke words mid-way ("Mediu/m",
 *   "DIFFICUL/TY"); the breakpoint is judged on the width divided by the
 *   font scale, so the grid folds before a word has to.
 * - **An odd tile out spans the whole row**, so three tiles read as two on top
 *   and one underneath rather than leaving a hole in the grid.
 */
export const statCellWidths = (
  cardWidth: number,
  count: number,
  frame: { border: number; gap: number },
  fontScale: number = ValueConstants.one,
): readonly number[] | null => {
  if (cardWidth <= ValueConstants.zero) return null;
  const inner = cardWidth - frame.border * ValueConstants.two;
  const columns = cardWidth / Math.max(fontScale, ValueConstants.one) <= statGrid.narrowMaxWidth ? Math.min(statGrid.narrowColumns, count) : count;
  // Rounded down: tiles that sum to a hair over the row wrap one tile early.
  const cell = Math.floor(((inner - (columns - ValueConstants.one) * frame.gap) / columns) * CENTI) / CENTI;
  const doesSpanLast = columns < count && count % columns !== ValueConstants.zero;
  return Array.from({ length: count }, (_, i) => (doesSpanLast && i === count - ValueConstants.one ? inner : cell));
};

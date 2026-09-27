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
 * - **An odd tile out spans the whole row**, so three tiles read as two on top
 *   and one underneath rather than leaving a hole in the grid.
 */
export const statCellWidths = (
  cardWidth: number,
  count: number,
  frame: { border: number; gap: number },
): readonly number[] | null => {
  if (cardWidth <= ValueConstants.zero) return null;
  const inner = cardWidth - frame.border * ValueConstants.two;
  const columns = cardWidth <= statGrid.narrowMaxWidth ? Math.min(statGrid.narrowColumns, count) : count;
  // Rounded down: tiles that sum to a hair over the row wrap one tile early.
  const cell = Math.floor(((inner - (columns - ValueConstants.one) * frame.gap) / columns) * CENTI) / CENTI;
  const spansLast = columns < count && count % columns !== ValueConstants.zero;
  return Array.from({ length: count }, (_, i) => (spansLast && i === count - ValueConstants.one ? inner : cell));
};

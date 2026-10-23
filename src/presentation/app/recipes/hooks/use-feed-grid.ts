import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const RECIPE_CARD_MIN_WIDTH = 300;
const GRID_GAP = spacing.lg2;

/**
 * How many recipe cards fit across the wide feed, and how wide one may grow.
 *
 * @remarks
 * - **One column on a phone**; on a wide layout as many as keep each card at
 *   least {@link RECIPE_CARD_MIN_WIDTH} wide.
 * - **The cell width is capped** because `numColumns` does not pad a short
 *   last row: two cards on the last row of a three-column grid would stretch.
 */
export const useFeedGrid = (isExpanded: boolean, width: number): { gridColumns: number; gridCellMaxWidth: number } => {
  const available = feedContentWidth(width);
  const gridColumns = isExpanded
    ? Math.max(ValueConstants.one, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)))
    : ValueConstants.one;
  const gridCellMaxWidth = (available - GRID_GAP * (gridColumns - ValueConstants.one)) / gridColumns;
  return { gridColumns, gridCellMaxWidth };
};

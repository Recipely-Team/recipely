import { ValueConstants } from '@core/constants';
import { spacing } from '@presentation/base/theme';

/** Minimum card width the web grid packs against before adding a column. */
export const RECIPE_CARD_MIN_WIDTH = 320;
/** Gutter between grid columns/rows on the web shell. */
export const GRID_GAP = spacing.lg2;
/**
 * Half the gutter, padded on each side of a grid cell: FlashList gives every
 * column an equal share and has no `columnWrapperStyle`, so two neighbours'
 * insets make the gutter between them.
 */
export const GRID_CELL_INSET = GRID_GAP / ValueConstants.two;
/** The list's side padding in a grid, so the outer cells' inset still adds up to `spacing.lg`. */
export const GRID_EDGE_INSET = spacing.lg - GRID_CELL_INSET;

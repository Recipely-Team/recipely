/** Grid widths at which one more column fits a tile big enough to judge a photo by. */
const FOUR_COLUMNS_FROM = 420;
const FIVE_COLUMNS_FROM = 600;

const Columns = {
  narrow: 3,
  medium: 4,
  wide: 5,
} as const;

/**
 * How many columns the editor's photo grid takes at a width.
 *
 * The width is the GRID's own, measured — the sheet is a phone-wide panel on
 * mobile and a centred dialog on the web, so the window says nothing useful.
 */
export const photoGridColumns = (width: number): number =>
  width >= FIVE_COLUMNS_FROM ? Columns.wide : width >= FOUR_COLUMNS_FROM ? Columns.medium : Columns.narrow;

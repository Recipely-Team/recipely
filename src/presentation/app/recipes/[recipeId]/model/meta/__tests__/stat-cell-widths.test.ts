import { statCellWidths } from '@presentation/app/recipes/[recipeId]/model/meta/stat-cell-widths';

/**
 * "Yazıları büyütünce … metinler dışarı taşıyor": at 1.5× system text the
 * recipe's four stat tiles stayed in one row on a 360 dp phone and broke
 * words mid-way — "Mediu/m", "SERVING/S", "DIFFICUL/TY".
 */

const FRAME = { border: 1, gap: 1 } as const;
const PHONE_CARD = 328;
const FOUR_TILES = 4;

const columnsOf = (widths: readonly number[] | null): number =>
  widths === null ? 0 : widths.filter((width) => width === widths[0]).length;

describe('the recipe stat grid under larger system text', () => {
  it('keeps one row of four at normal text size', () => {
    expect(columnsOf(statCellWidths(PHONE_CARD + 40, FOUR_TILES, FRAME, 1))).toBe(FOUR_TILES);
  });

  it('folds into two columns at 1.5× text instead of breaking words', () => {
    const widths = statCellWidths(PHONE_CARD + 40, FOUR_TILES, FRAME, 1.5);

    expect(widths?.[0]).toBeGreaterThan((PHONE_CARD + 40) / 3);
  });

  it('never folds earlier than before for text set smaller than normal', () => {
    expect(statCellWidths(PHONE_CARD + 40, FOUR_TILES, FRAME, 0.85)).toEqual(
      statCellWidths(PHONE_CARD + 40, FOUR_TILES, FRAME, 1),
    );
  });
});

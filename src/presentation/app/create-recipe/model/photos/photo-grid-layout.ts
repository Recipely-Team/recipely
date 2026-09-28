import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { photoGridColumns } from '@presentation/app/create-recipe/model/photos/photo-grid-columns';

/** The cover spans this many columns and rows. */
const COVER_SPAN = 2;

interface GridCell {
  x: number;
  y: number;
}

interface PhotoGridLayout {
  columns: number;
  tile: number;
  cover: number;
  /** One cell per photo after the cover, then one for the Add tile, row-major into the free cells. */
  cells: GridCell[];
  height: number;
}

/**
 * Where every tile of the editor's photo grid sits.
 *
 * @remarks
 * - **The cover is 2×2 at the top-left**, so rows 0 and 1 start at column 2;
 *   from row 2 on every column is free.
 * - **Absolute positions, not flex-wrap.** A 2×2 tile in a wrapping row pushes
 *   the rest below it; the prototype flows them into the cells beside it.
 */
export const photoGridLayout = (width: number, count: number): PhotoGridLayout => {
  const gap = spacing.sm;
  const columns = photoGridColumns(width);
  const tile = (width - (columns - ValueConstants.one) * gap) / columns;
  const cover = tile * COVER_SPAN + gap;
  const cells: GridCell[] = [];
  const wanted = Math.max(count - ValueConstants.one, ValueConstants.zero) + ValueConstants.one;

  for (let row = ValueConstants.zero; cells.length < wanted; row += ValueConstants.one) {
    for (let col = ValueConstants.zero; col < columns && cells.length < wanted; col += ValueConstants.one) {
      if (row < COVER_SPAN && col < COVER_SPAN) continue;
      cells.push({ x: col * (tile + gap), y: row * (tile + gap) });
    }
  }

  const lastBottom = cells.reduce((bottom, cell) => Math.max(bottom, cell.y + tile), ValueConstants.zero);
  return { columns, tile, cover, cells, height: Math.max(cover, lastBottom) };
};

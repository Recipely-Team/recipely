/**
 * The editor's photo grid takes its column count from its own width — three
 * on a phone sheet, four from 420, five from 600 — and flows every photo after
 * the 2×2 cover into the cells beside and below it.
 */

import { photoGridColumns } from '@presentation/app/create-recipe/model/photos/photo-grid-columns';
import { photoGridLayout } from '@presentation/app/create-recipe/model/photos/photo-grid-layout';
import { spacing } from '@presentation/base/theme';

describe('photoGridColumns', () => {
  it.each([
    [343, 3],
    [419, 3],
    [420, 4],
    [599, 4],
    [600, 5],
    [900, 5],
  ])('at %i wide the grid takes %i columns', (width, columns) => {
    expect(photoGridColumns(width)).toBe(columns);
  });
});

describe('photoGridLayout', () => {
  it('sizes a 375 phone sheet the way the prototype resolves it', () => {
    const layout = photoGridLayout(343, 1);
    const tile = (343 - 2 * spacing.sm) / 3;

    expect(layout.tile).toBeCloseTo(tile);
    expect(layout.cover).toBeCloseTo(tile * 2 + spacing.sm);
  });

  it('puts the photos after the cover beside it before going below', () => {
    const { cells, tile, columns } = photoGridLayout(343, 4);
    const step = tile + spacing.sm;

    expect(columns).toBe(3);
    // Photos 2 and 3 fill column 2 of rows 0 and 1; photo 4 and the Add tile start row 2.
    expect(cells.map((c) => [Math.round(c.x / step), Math.round(c.y / step)])).toEqual([
      [2, 0],
      [2, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it('keeps the Add tile as the last cell', () => {
    expect(photoGridLayout(600, 1).cells).toHaveLength(1);
    expect(photoGridLayout(600, 6).cells).toHaveLength(6);
  });
});

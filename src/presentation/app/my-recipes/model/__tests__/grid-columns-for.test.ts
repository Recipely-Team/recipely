import { gridColumnsFor } from '@presentation/app/my-recipes/model/grid-columns-for';

describe('gridColumnsFor', () => {
  it('is one column on a phone whatever the width', () => {
    expect(gridColumnsFor(false, 2000)).toBe(1);
  });

  it('fits more columns on a wider expanded screen, never fewer than one', () => {
    const narrow = gridColumnsFor(true, 700);
    const wide = gridColumnsFor(true, 1400);
    expect(narrow).toBeGreaterThanOrEqual(1);
    expect(wide).toBeGreaterThanOrEqual(narrow);
    expect(gridColumnsFor(true, 10)).toBe(1);
  });
});

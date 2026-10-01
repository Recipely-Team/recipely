import { autoFillColumns } from '@presentation/base/widgets/creators/auto-fill-columns';

describe('autoFillColumns', () => {
  it('fits as many minimum-width cards as the width holds, never fewer than the floor', () => {
    expect(autoFillColumns(1136, 180, 20, 2)).toBe(5);
    expect(autoFillColumns(948, 270, 24, 2)).toBe(3);
    expect(autoFillColumns(300, 270, 24, 2)).toBe(2);
  });
});

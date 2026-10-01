import { webCreatorsColumns } from '@presentation/app/recipes/model/web-creators-columns';

describe('webCreatorsColumns', () => {
  it('draws six creators from an 860-wide viewport and three below it', () => {
    expect(webCreatorsColumns(1280)).toBe(6);
    expect(webCreatorsColumns(860)).toBe(6);
    expect(webCreatorsColumns(859)).toBe(3);
  });
});

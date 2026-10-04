import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { toPage } from '@infrastructure/network/paging/to-page';

const parse = (raw: string) => (raw.length > 0 ? ok(raw.toUpperCase()) : fail(new ValidationFailure('empty', 'item')));

describe('toPage', () => {
  it('maps every item and carries the envelope through', () => {
    const page = toPage({ items: ['a', 'b'], total: 45, page: 2, pageSize: 20 }, parse);
    expect(page).toEqual({ items: ['A', 'B'], total: 45, page: 2, pageSize: 20, hasMore: true });
  });

  it('says there is more only while page * pageSize is under total', () => {
    expect(toPage({ items: ['a'], total: 21, page: 1, pageSize: 20 }, parse).hasMore).toBe(true);
    expect(toPage({ items: ['a'], total: 40, page: 2, pageSize: 20 }, parse).hasMore).toBe(false);
  });

  it('skips an unreadable item without making the list look finished', () => {
    const page = toPage({ items: ['a', '', 'c'], total: 30, page: 1, pageSize: 3 }, parse);
    expect(page.items).toEqual(['A', 'C']);
    expect(page.hasMore).toBe(true);
  });
});

import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import { ListPosition } from '@application/store/paging/list-position';
import type { PagedList } from '@application/store/paging/paged-list';
import { NetworkFailure, type Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';

interface Row {
  id: string;
  label?: string;
}

const PAGE_SIZE = 2;

const pageOf = (page: number, ids: string[], total: number): Result<Page<Row>, Failure> =>
  ok({ items: ids.map((id) => ({ id })), total, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < total });

/** A fetch whose answers the test releases by hand, in any order. */
const deferredFetch = () => {
  const pending: { page: number; resolve: (value: Result<Page<Row>, Failure>) => void }[] = [];
  const fetch = (page: number) =>
    new Promise<Result<Page<Row>, Failure>>((resolve) => {
      pending.push({ page, resolve });
    });
  return { fetch, pending };
};

const makeLoader = () => {
  let list: PagedList<Row> = { status: 'idle' };
  const loader = new PagedListLoader<Row>(() => list, (next) => { list = next; }, (row) => row.id);
  return { loader, read: () => list };
};

const ids = (list: PagedList<Row>): string[] => (list.status === 'loaded' ? list.items.map((row) => row.id) : []);

describe('PagedListLoader', () => {
  it('drops a stale first page that lands after a newer one', async () => {
    const { loader, read } = makeLoader();
    const old = deferredFetch();
    const oldLoad = loader.load(old.fetch);
    await loader.load(() => Promise.resolve(pageOf(1, ['new'], 1)));
    old.pending[0]?.resolve(pageOf(1, ['old'], 1));
    await oldLoad;

    expect(ids(read())).toEqual(['new']);
  });

  it('drops a next page that lands after the first page was asked for again', async () => {
    const { loader, read } = makeLoader();
    const slow = deferredFetch();
    await loader.load((page) => (page === 1 ? Promise.resolve(pageOf(1, ['a', 'b'], 4)) : slow.fetch(page)));
    const more = loader.loadMore();
    await loader.load(() => Promise.resolve(pageOf(1, ['x'], 1)));
    slow.pending[0]?.resolve(pageOf(2, ['c', 'd'], 4));
    await more;

    expect(ids(read())).toEqual(['x']);
  });

  it('drops a next page that lands after reset', async () => {
    const { loader, read } = makeLoader();
    const slow = deferredFetch();
    await loader.load((page) => (page === 1 ? Promise.resolve(pageOf(1, ['a', 'b'], 4)) : slow.fetch(page)));
    const more = loader.loadMore();
    loader.reset();
    slow.pending[0]?.resolve(pageOf(2, ['c', 'd'], 4));
    await more;

    expect(read().status).toBe('idle');
  });

  it('appends the next page with the first page fetch', async () => {
    const { loader, read } = makeLoader();
    await loader.load((page) => Promise.resolve(page === 1 ? pageOf(1, ['a', 'b'], 3) : pageOf(2, ['c'], 3)));
    await loader.loadMore();

    expect(ids(read())).toEqual(['a', 'b', 'c']);
    expect(read()).toMatchObject({ page: 2, hasMore: false });
  });

  it('refresh keeps the loaded rows on screen while it fetches and when it fails', async () => {
    const { loader, read } = makeLoader();
    await loader.load(() => Promise.resolve(pageOf(1, ['a', 'b'], 2)));
    const again = deferredFetch();
    const refreshing = loader.refresh(again.fetch);

    expect(ids(read())).toEqual(['a', 'b']);
    again.pending[0]?.resolve(fail(new NetworkFailure('offline')));
    await refreshing;
    expect(ids(read())).toEqual(['a', 'b']);
  });

  it('refresh replaces the rows on success and loads normally from idle', async () => {
    const { loader, read } = makeLoader();
    await loader.refresh(() => Promise.resolve(pageOf(1, ['a'], 1)));
    await loader.refresh(() => Promise.resolve(pageOf(1, ['b'], 1)));

    expect(ids(read())).toEqual(['b']);
  });

  it('removeItem drops the row and floors total at zero', async () => {
    const { loader, read } = makeLoader();
    await loader.load(() => Promise.resolve(pageOf(1, ['a', 'b'], 0)));
    loader.removeItem('a');
    loader.removeItem('missing');

    expect(ids(read())).toEqual(['b']);
    expect(read()).toMatchObject({ total: 0 });
  });

  it('upsertItem replaces in place, prepends by default and appends on request', async () => {
    const { loader, read } = makeLoader();
    await loader.load(() => Promise.resolve(pageOf(1, ['a', 'b'], 2)));
    loader.upsertItem({ id: 'b', label: 'edited' });
    loader.upsertItem({ id: 'c' });
    loader.upsertItem({ id: 'd' }, ListPosition.End);

    expect(ids(read())).toEqual(['c', 'a', 'b', 'd']);
    expect(read()).toMatchObject({ total: 4 });
    const list = read();
    expect(list.status === 'loaded' && list.items[2]?.label).toBe('edited');
  });

  it('edits nothing before the list has loaded', () => {
    const { loader, read } = makeLoader();
    loader.upsertItem({ id: 'a' });
    loader.removeItem('a');

    expect(read().status).toBe('idle');
  });
});

import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';
import { loadMorePaging } from '@application/store/paging/list-paging/load-more-paging';
import { pagingAfterRemoval } from '@application/store/paging/list-paging/paging-after-removal';
import { pagingOf } from '@application/store/paging/list-paging/paging-of';

const pageOf = (page: number, items: string[], total = 60): Page<string> => ({
  items,
  page,
  pageSize: 20,
  total,
  hasMore: page * 20 < total,
});

const harness = (start: ListPaging, fetch: jest.Mock) => {
  let paging = start;
  const rows: string[] = [];
  return {
    read: () => paging,
    run: () =>
      loadMorePaging<string>({
        read: () => paging,
        write: (next) => {
          paging = next;
        },
        fetch,
        isCurrent: () => true,
        append: (items) => rows.push(...items),
      }),
    remove: () => {
      paging = pagingAfterRemoval(paging);
    },
    rows,
  };
};

describe('loadMorePaging (Saved, Liked, Created)', () => {
  it('asks for the next page and appends it', async () => {
    const fetch = jest.fn().mockResolvedValue(ok(pageOf(2, ['b'])));
    const h = harness(pagingOf(pageOf(1, ['a'])), fetch);
    await h.run();
    expect(fetch).toHaveBeenCalledWith(2);
    expect(h.rows).toEqual(['b']);
    expect(h.read().page).toBe(2);
  });

  // Unsaving a recipe shifted the server's rows up; asking `page + 1` skipped the one that moved into page 1.
  it('re-reads from the shifted offset after a row was removed, instead of skipping rows', async () => {
    const fetch = jest.fn().mockResolvedValue(ok(pageOf(1, ['x'])));
    const h = harness(pagingOf(pageOf(1, ['a'])), fetch);
    h.remove();
    await h.run();
    expect(fetch).toHaveBeenCalledWith(1);
  });

  // A failed next page cleared the spinner and nothing else: no "Try again", and the list never asked again.
  it('records why the next page failed so the footer can offer Try again, and a retry clears it', async () => {
    const failure = new NetworkFailure('offline');
    const fetch = jest.fn().mockResolvedValueOnce(fail(failure)).mockResolvedValueOnce(ok(pageOf(2, ['b'])));
    const h = harness(pagingOf(pageOf(1, ['a'])), fetch);
    await h.run();
    expect(h.read()).toMatchObject({ isLoadingMore: false, moreFailure: failure });
    await h.run();
    expect(h.read().moreFailure).toBeNull();
    expect(h.rows).toEqual(['b']);
  });

  it('carries a removal made while the page was in flight over to the page after', async () => {
    let h: ReturnType<typeof harness>;
    const fetch = jest.fn(async () => {
      h.remove();
      return ok(pageOf(2, ['b']));
    });
    h = harness(pagingOf(pageOf(1, ['a'])), fetch);
    await h.run();
    expect(h.read().removed).toBe(1);
  });

  it('does nothing on the last page or while a page is on its way', async () => {
    const fetch = jest.fn();
    await harness(pagingOf(pageOf(3, ['c'])), fetch).run();
    await harness({ ...pagingOf(pageOf(1, ['a'])), isLoadingMore: true }, fetch).run();
    expect(fetch).not.toHaveBeenCalled();
  });
});

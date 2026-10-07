import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { ok, fail } from '@core/result/result-helpers';
import { UnknownFailure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';

/**
 * The symptom: a user with more than one page of drafts saw the first 20 and
 * nothing else, with no way to reach the rest and no sign any were missing.
 *
 * The store asked for `page: 1` as a literal and threw away the `total` the
 * repository handed back, so nothing in the app ever knew there was a second
 * page — the same shape as the recipe-feed paging bug, one layer up.
 */

const PAGE = 2;

const draft = (id: string): RecipeDraft => ({
  id,
  ownerId: 'owner-1',
  prompt: `prompt-${id}`,
  snapshot: { name: id },
  chatHistory: [],
  createdAt: new Date('2026-05-11T12:00:00.000Z'),
  updatedAt: new Date('2026-05-11T12:00:00.000Z'),
});

/** A server holding `rows` in order, paged by `PAGE`; `requested` records each page asked for. */
const server = (rows: string[]) => {
  const requested: number[] = [];
  const fetch = (pageNumber: number) => {
    requested.push(pageNumber);
    const items = rows.slice((pageNumber - 1) * PAGE, pageNumber * PAGE).map(draft);
    return ok({ items, total: rows.length, page: pageNumber, pageSize: PAGE, hasMore: pageNumber * PAGE < rows.length });
  };
  return { rows, requested, fetch };
};

const storeOver = (execute: ListDraftsUseCase['execute']) =>
  configureDraftsStore({
    listDraftsUseCase: { execute } as unknown as ListDraftsUseCase,
    getLatestDraftUseCase: { execute: () => Promise.resolve(ok(null)) } as unknown as GetLatestDraftUseCase,
    getDraftUseCase: {
      execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
    } as unknown as GetDraftUseCase,
    upsertDraftUseCase: {
      execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
    } as unknown as UpsertDraftUseCase,
    deleteDraftUseCase: { execute: () => Promise.resolve(ok(undefined)) } as unknown as DeleteDraftUseCase,
  });

type DraftsStore = ReturnType<typeof storeOver>;

const storeWithPages = () => {
  const backend = server(['a', 'b', 'c']);
  const store = storeOver((pageNumber) => Promise.resolve(backend.fetch(pageNumber)));
  return { store, requested: backend.requested, backend };
};

const loaded = (store: DraftsStore) => {
  const list = store.getState().drafts;
  if (list.status !== StoreStatus.Loaded) throw new Error('expected loaded');
  return list;
};

const ids = (store: DraftsStore): string[] => loadedItems(store.getState().drafts).map((d) => d.id);

describe('drafts beyond the first page', () => {
  it('reports that more drafts exist when the backend says so', async () => {
    const { store } = storeWithPages();

    await store.getState().loadDrafts();

    expect(loaded(store)).toMatchObject({ hasMore: true, page: 1 });
  });

  it('asks for the NEXT page, not the first one again', async () => {
    const { store, requested } = storeWithPages();

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(requested).toEqual([1, 2]);
  });

  it('appends the next page and stops offering more once every draft is loaded', async () => {
    const { store } = storeWithPages();

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(ids(store)).toEqual(['a', 'b', 'c']);
    expect(loaded(store).hasMore).toBe(false);
  });

  it('does not fire a second request while one is already in flight', async () => {
    const { store, requested } = storeWithPages();
    await store.getState().loadDrafts();

    await Promise.all([store.getState().loadMoreDrafts(), store.getState().loadMoreDrafts()]);

    expect(requested).toEqual([1, 2]);
  });

  it('keeps the loaded drafts on screen when the append fails', async () => {
    const backend = server(['a', 'b', 'c']);
    const store = storeOver((pageNumber) =>
      Promise.resolve(pageNumber === 1 ? backend.fetch(1) : fail(new UnknownFailure('offline'))),
    );

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(ids(store)).toEqual(['a', 'b']);
    expect(loaded(store).isLoadingMore).toBe(false);
  });

  /** Deleting a draft moves every later server row up one; the next page must not skip the one that moved in. */
  it('scrolling after a delete shows the draft that moved up into the loaded page', async () => {
    const { store, backend } = storeWithPages();
    await store.getState().loadDrafts();

    backend.rows.splice(0, 1);
    await store.getState().deleteDraft('a');
    await store.getState().loadMoreDrafts();

    expect(ids(store)).toEqual(['b', 'c']);
  });

  /** `loadMoreDrafts` had no session guard: a page landing after sign-out showed the previous account's drafts. */
  it('a next page that lands after sign-out does not publish', async () => {
    const backend = server(['a', 'b', 'c']);
    const pending: (() => void)[] = [];
    const store = storeOver((pageNumber) =>
      pageNumber === 1
        ? Promise.resolve(backend.fetch(1))
        : new Promise((resolve) => {
            pending.push(() => resolve(backend.fetch(pageNumber)));
          }),
    );
    await store.getState().loadDrafts();

    const more = store.getState().loadMoreDrafts();
    store.getState().clear();
    pending.forEach((release) => release());
    await more;

    expect(store.getState().drafts.status).toBe(StoreStatus.Idle);
  });
});

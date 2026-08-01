import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { ListDraftsInput } from '@application/drafts/list/list-drafts-input';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { ok , fail } from '@core/result/result-helpers';
import { UnknownFailure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { StoreStatus } from '@application/store/store-status';
import { DRAFTS_PAGE_SIZE } from '@infrastructure/constants/api';

/**
 * The symptom: a user with more than one page of drafts saw the first 20 and
 * nothing else, with no way to reach the rest and no sign any were missing.
 *
 * The store asked for `page: 1` as a literal and threw away the `total` the
 * repository handed back, so nothing in the app ever knew there was a second
 * page — the same shape as the recipe-feed paging bug, one layer up.
 */

const draft = (id: string): RecipeDraft => ({
  id,
  ownerId: 'owner-1',
  prompt: `prompt-${id}`,
  snapshot: { name: id },
  chatHistory: [],
  createdAt: new Date('2026-05-11T12:00:00.000Z'),
  updatedAt: new Date('2026-05-11T12:00:00.000Z'),
});

const page = (ids: string[], total: number, pageNumber: number) =>
  ok({ items: ids.map(draft), total, page: pageNumber, pageSize: DRAFTS_PAGE_SIZE });

const storeWithPages = () => {
  const requested: number[] = [];
  const listDraftsUseCase = {
    execute: (input: ListDraftsInput) => {
      requested.push(input.page);
      return Promise.resolve(
        input.page === 1 ? page(['a', 'b'], 3, 1) : page(['c'], 3, 2),
      );
    },
  } as unknown as ListDraftsUseCase;

  const store = configureDraftsStore({
    listDraftsUseCase,
    getLatestDraftUseCase: { execute: () => Promise.resolve(ok(null)) } as unknown as GetLatestDraftUseCase,
    getDraftUseCase: {
      execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
    } as unknown as GetDraftUseCase,
    upsertDraftUseCase: {
      execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
    } as unknown as UpsertDraftUseCase,
    deleteDraftUseCase: { execute: () => Promise.resolve(ok(undefined)) } as unknown as DeleteDraftUseCase,
  });

  return { store, requested };
};

describe('drafts beyond the first page', () => {
  it('reports that more drafts exist when the backend says so', async () => {
    const { store } = storeWithPages();

    await store.getState().loadDrafts();

    const state = store.getState().listState;
    expect(state.status).toBe(StoreStatus.Loaded);
    if (state.status !== StoreStatus.Loaded) return;
    expect(state.hasMore).toBe(true);
    expect(state.page).toBe(1);
  });

  it('asks for the NEXT page, not the first one again', async () => {
    const { store, requested } = storeWithPages();

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(requested).toEqual([1, 2]);
  });

  it('appends the next page instead of replacing what is on screen', async () => {
    const { store } = storeWithPages();

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(store.getState().drafts.map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });

  it('stops offering more once every draft is loaded', async () => {
    const { store } = storeWithPages();

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    const state = store.getState().listState;
    if (state.status !== StoreStatus.Loaded) throw new Error('expected loaded');
    expect(state.hasMore).toBe(false);
  });

  it('does not fire a second request while one is already in flight', async () => {
    const { store, requested } = storeWithPages();
    await store.getState().loadDrafts();

    await Promise.all([store.getState().loadMoreDrafts(), store.getState().loadMoreDrafts()]);

    expect(requested).toEqual([1, 2]);
  });

  it('keeps the loaded drafts on screen when the append fails', async () => {
    const listDraftsUseCase = {
      execute: (input: ListDraftsInput) =>
        Promise.resolve(
          input.page === 1 ? page(['a', 'b'], 3, 1) : fail(new UnknownFailure('offline')),
        ),
    } as unknown as ListDraftsUseCase;
    const store = configureDraftsStore({
      listDraftsUseCase,
      getLatestDraftUseCase: { execute: () => Promise.resolve(ok(null)) } as unknown as GetLatestDraftUseCase,
      getDraftUseCase: {
        execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
      } as unknown as GetDraftUseCase,
      upsertDraftUseCase: {
        execute: () => Promise.resolve(fail(new UnknownFailure('unused'))),
      } as unknown as UpsertDraftUseCase,
      deleteDraftUseCase: { execute: () => Promise.resolve(ok(undefined)) } as unknown as DeleteDraftUseCase,
    });

    await store.getState().loadDrafts();
    await store.getState().loadMoreDrafts();

    expect(store.getState().drafts.map((d) => d.id)).toEqual(['a', 'b']);
    const state = store.getState().listState;
    if (state.status !== StoreStatus.Loaded) throw new Error('expected loaded');
    expect(state.isLoadingMore).toBe(false);
  });
});

import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { ListDraftsInput } from '@application/drafts/list/list-drafts-input';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { UnknownFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { PagedDrafts } from '@domain/drafts/paged-drafts';
import type { UpsertDraftInput } from '@domain/drafts/upsert-draft-input';

const makeDraft = (id: string): RecipeDraft => ({
  id,
  ownerId: 'owner-1',
  prompt: `prompt-${id}`,
  snapshot: { name: id },
  chatHistory: [],
  createdAt: new Date('2026-05-11T12:00:00.000Z'),
  updatedAt: new Date('2026-05-11T12:00:00.000Z'),
});

const makePage = (items: RecipeDraft[]): PagedDrafts => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
});

interface StubConfig {
  listResult?: Result<PagedDrafts, Failure>;
  latestResult?: Result<RecipeDraft | null, Failure>;
  draftResult?: Result<RecipeDraft, Failure>;
  upsertResult?: Result<RecipeDraft, Failure>;
  deleteResult?: Result<void, Failure>;
}

const makeStore = (config: StubConfig = {}) => {
  const listDraftsUseCase = {
    execute: (_input: ListDraftsInput) =>
      Promise.resolve(config.listResult ?? fail(new UnknownFailure('not configured'))),
  } as unknown as ListDraftsUseCase;
  const getLatestDraftUseCase = {
    execute: () => Promise.resolve(config.latestResult ?? ok(null)),
  } as unknown as GetLatestDraftUseCase;
  const getDraftUseCase = {
    execute: (_id: string) =>
      Promise.resolve(config.draftResult ?? fail(new UnknownFailure('not configured'))),
  } as unknown as GetDraftUseCase;
  const upsertDraftUseCase = {
    execute: (_input: UpsertDraftInput) =>
      Promise.resolve(config.upsertResult ?? fail(new UnknownFailure('not configured'))),
  } as unknown as UpsertDraftUseCase;
  const deleteDraftUseCase = {
    execute: (_id: string) => Promise.resolve(config.deleteResult ?? ok(undefined)),
  } as unknown as DeleteDraftUseCase;

  return configureDraftsStore({
    listDraftsUseCase,
    getLatestDraftUseCase,
    getDraftUseCase,
    upsertDraftUseCase,
    deleteDraftUseCase,
  });
};

describe('draftsStore initial state', () => {
  it('starts empty with idle listState and null latestDraft', () => {
    const store = makeStore();

    expect(store.getState().drafts).toEqual([]);
    expect(store.getState().listState).toEqual({ status: 'idle' });
    expect(store.getState().latestDraft).toBeNull();
  });
});

describe('draftsStore.loadDrafts', () => {
  it('populates drafts and sets listState loaded on success', async () => {
    const drafts = [makeDraft('a'), makeDraft('b')];
    const store = makeStore({ listResult: ok(makePage(drafts)) });

    await store.getState().loadDrafts();

    const s = store.getState();
    expect(s.drafts.map((d) => d.id)).toEqual(['a', 'b']);
    expect(s.listState).toEqual({ status: 'loaded', page: 1, hasMore: false });
  });

  it('sets listState error and leaves drafts empty on failure', async () => {
    const failure = new UnknownFailure('boom');
    const store = makeStore({ listResult: fail(failure) });

    await store.getState().loadDrafts();

    const s = store.getState();
    expect(s.listState.status).toBe('error');
    if (s.listState.status === 'error') {
      expect(s.listState.failure).toBe(failure);
    }
    expect(s.drafts).toEqual([]);
  });
});

describe('draftsStore.loadLatestDraft', () => {
  it('sets latestDraft when one exists', async () => {
    const draft = makeDraft('latest');
    const store = makeStore({ latestResult: ok(draft) });

    await store.getState().loadLatestDraft();

    expect(store.getState().latestDraft).toBe(draft);
  });

  it('leaves latestDraft null when the user has none', async () => {
    const store = makeStore({ latestResult: ok(null) });

    await store.getState().loadLatestDraft();

    expect(store.getState().latestDraft).toBeNull();
  });

  it('leaves state untouched on failure', async () => {
    const store = makeStore({ latestResult: fail(new UnknownFailure('boom')) });

    await store.getState().loadLatestDraft();

    expect(store.getState().latestDraft).toBeNull();
  });
});

describe('draftsStore.upsertDraft', () => {
  it('prepends a new draft to the local list and sets it as latestDraft', async () => {
    const existing = makeDraft('a');
    const saved = makeDraft('b');
    const store = makeStore({ listResult: ok(makePage([existing])), upsertResult: ok(saved) });
    await store.getState().loadDrafts();

    const returned = await store.getState().upsertDraft({
      id: 'b',
      prompt: 'p',
      snapshot: {},
      chatHistory: [],
    });

    const s = store.getState();
    expect(s.drafts.map((d) => d.id)).toEqual(['b', 'a']);
    expect(s.latestDraft).toBe(saved);
    expect(returned).toBe(saved);
  });

  it('replaces an existing draft in place rather than duplicating it', async () => {
    const original = makeDraft('a');
    const updated: RecipeDraft = { ...makeDraft('a'), prompt: 'updated' };
    const store = makeStore({ listResult: ok(makePage([original])), upsertResult: ok(updated) });
    await store.getState().loadDrafts();

    await store.getState().upsertDraft({
      id: 'a',
      prompt: 'updated',
      snapshot: {},
      chatHistory: [],
    });

    const s = store.getState();
    expect(s.drafts.map((d) => d.id)).toEqual(['a']);
    expect(s.drafts[0].prompt).toBe('updated');
    expect(s.latestDraft).toBe(updated);
  });

  it('returns null and does not mutate the list on failure', async () => {
    const existing = makeDraft('a');
    const store = makeStore({
      listResult: ok(makePage([existing])),
      upsertResult: fail(new UnknownFailure('boom')),
    });
    await store.getState().loadDrafts();

    const returned = await store.getState().upsertDraft({
      id: 'b',
      prompt: 'p',
      snapshot: {},
      chatHistory: [],
    });

    expect(returned).toBeNull();
    expect(store.getState().drafts.map((d) => d.id)).toEqual(['a']);
  });
});

describe('draftsStore.deleteDraft', () => {
  it('removes the draft locally and clears latestDraft when it pointed to it', async () => {
    const a = makeDraft('a');
    const b = makeDraft('b');
    const store = makeStore({ listResult: ok(makePage([a, b])), latestResult: ok(a) });
    await store.getState().loadDrafts();
    await store.getState().loadLatestDraft();

    await store.getState().deleteDraft('a');

    const s = store.getState();
    expect(s.drafts.map((d) => d.id)).toEqual(['b']);
    expect(s.latestDraft).toBeNull();
  });

  it('keeps latestDraft when a different draft is deleted', async () => {
    const a = makeDraft('a');
    const b = makeDraft('b');
    const store = makeStore({ listResult: ok(makePage([a, b])), latestResult: ok(a) });
    await store.getState().loadDrafts();
    await store.getState().loadLatestDraft();

    await store.getState().deleteDraft('b');

    const s = store.getState();
    expect(s.drafts.map((d) => d.id)).toEqual(['a']);
    expect(s.latestDraft).toBe(a);
  });

  it('does not mutate the list on failure', async () => {
    const a = makeDraft('a');
    const store = makeStore({
      listResult: ok(makePage([a])),
      deleteResult: fail(new UnknownFailure('boom')),
    });
    await store.getState().loadDrafts();

    await store.getState().deleteDraft('a');

    expect(store.getState().drafts.map((d) => d.id)).toEqual(['a']);
  });
});

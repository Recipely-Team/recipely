import { NetworkFailure, NotFoundFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeDraftDto } from '@infrastructure/drafts/dtos/recipe-draft-dto';
import type { DraftsListDto } from '@infrastructure/drafts/dtos/drafts-list-dto';
import { RecipeDraftRepository } from '@infrastructure/drafts/recipe-draft-repository';

const draftDto: RecipeDraftDto = {
  id: 'd1e2f3a4-5678-4901-bcde-f01234567890',
  ownerId: 'owner-9',
  prompt: 'spicy ramen',
  snapshot: { name: 'Spicy Ramen', ingredients: ['Noodles'] },
  chatHistory: [{ role: 'user', content: 'spicier please' }],
  createdAt: '2026-05-11T12:00:00.000Z',
  updatedAt: '2026-05-12T08:30:00.000Z',
};

const listDto: DraftsListDto = {
  items: [draftDto],
  total: 1,
  page: 2,
  pageSize: 20,
};

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const stub = {
    request: jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(result);
    }),
  } as unknown as HttpClient;
  return { http: stub, calls };
};

describe('RecipeDraftRepository.listDrafts', () => {
  it('GETs /recipes/drafts with page/pageSize params and maps the envelope', async () => {
    const { http, calls } = makeHttp(ok(listDto));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.listDrafts(2, 20);

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/recipes/drafts');
    expect(calls[0].params).toEqual({ page: 2, pageSize: 20 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.total).toBe(1);
      expect(r.value.page).toBe(2);
      expect(r.value.pageSize).toBe(20);
      expect(r.value.items).toHaveLength(1);
      expect(r.value.items[0].id).toBe(draftDto.id);
      expect(r.value.items[0].createdAt).toBeInstanceOf(Date);
    }
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.listDrafts(1, 20);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('RecipeDraftRepository.getLatestDraft', () => {
  it('GETs /recipes/drafts/latest and maps the draft', async () => {
    const { http, calls } = makeHttp(ok(draftDto));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.getLatestDraft();

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/recipes/drafts/latest');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value?.id).toBe(draftDto.id);
      expect(r.value?.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('maps a NotFoundFailure (no drafts yet) to ok(null)', async () => {
    const { http } = makeHttp(fail(new NotFoundFailure('no drafts')));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.getLatestDraft();

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it('propagates a non-404 failure unchanged', async () => {
    const failure = new UnknownFailure('boom');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.getLatestDraft();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('RecipeDraftRepository.getDraft', () => {
  it('GETs /recipes/drafts/:id with the id encoded and maps the draft', async () => {
    const { http, calls } = makeHttp(ok(draftDto));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.getDraft('a b/c');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/recipes/drafts/a%20b%2Fc');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.id).toBe(draftDto.id);
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NotFoundFailure('gone');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.getDraft('x');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('RecipeDraftRepository.upsertDraft', () => {
  it('PUTs /recipes/drafts/:id with the { prompt, snapshot, chatHistory } body (id stays out of the body)', async () => {
    const { http, calls } = makeHttp(ok(draftDto));
    const repo = new RecipeDraftRepository(http);

    const input = {
      id: 'd1e2f3a4-5678-4901-bcde-f01234567890',
      prompt: 'spicy ramen',
      snapshot: { name: 'Spicy Ramen', ingredients: ['Noodles'] },
      chatHistory: [{ role: 'user' as const, content: 'spicier please' }],
    };
    const r = await repo.upsertDraft(input);

    expect(calls[0].method).toBe('PUT');
    expect(calls[0].url).toBe('/recipes/drafts/d1e2f3a4-5678-4901-bcde-f01234567890');
    expect(calls[0].data).toEqual({
      prompt: 'spicy ramen',
      snapshot: { name: 'Spicy Ramen', ingredients: ['Noodles'] },
      chatHistory: [{ role: 'user', content: 'spicier please' }],
    });
    expect(JSON.stringify(calls[0].data)).not.toContain('"id"');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.id).toBe(draftDto.id);
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.upsertDraft({
      id: 'x',
      prompt: 'p',
      snapshot: {},
      chatHistory: [],
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('RecipeDraftRepository.deleteDraft', () => {
  it('DELETEs /recipes/drafts/:id and returns ok(void)', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.deleteDraft('id with space');

    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/recipes/drafts/id%20with%20space');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeUndefined();
  });

  it('propagates HttpClient failure unchanged', async () => {
    const failure = new UnknownFailure('boom');
    const { http } = makeHttp(fail(failure));
    const repo = new RecipeDraftRepository(http);

    const r = await repo.deleteDraft('x');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

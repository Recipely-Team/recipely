import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CommentEntity } from '@domain/comments/comment-entity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { CommentDto } from '@infrastructure/comments/dtos/comment-dto';
import type { CommentPageDto } from '@infrastructure/comments/dtos/comment-page-dto';
import { CommentRepository } from '@infrastructure/comments/comment-repository';

const validDto: CommentDto = {
  id: 'c1',
  body: 'Looks delicious!',
  moderationStatus: 'approved',
  recipeId: 'recipe-3',
  authorId: 'author-9',
  authorDisplayName: 'Ada Lovelace',
  authorPhotoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  createdAt: '2026-05-11T12:00:00.000Z',
  updatedAt: '2026-05-11T12:00:00.000Z',
  likeCount: 7,
  likedByMe: true,
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

const makePageDto = (items: CommentDto[]): CommentPageDto => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
});

describe('CommentRepository.like', () => {
  it('issues POST to the comment like endpoint and returns ok on success', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const repo = new CommentRepository(http);

    const r = await repo.like('recipe-3', 'comment-7');

    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/recipes/recipe-3/comments/comment-7/like');
  });

  it('propagates the HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new CommentRepository(http);

    const r = await repo.like('recipe-3', 'comment-7');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('encodes recipe and comment ids in the URL', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const repo = new CommentRepository(http);

    await repo.like('recipe/3 a', 'comment#7');

    expect(calls[0].url).toBe('/recipes/recipe%2F3%20a/comments/comment%237/like');
  });
});

describe('CommentRepository.unlike', () => {
  it('issues DELETE to the comment like endpoint and returns ok on success', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const repo = new CommentRepository(http);

    const r = await repo.unlike('recipe-3', 'comment-7');

    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/recipes/recipe-3/comments/comment-7/like');
  });

  it('propagates the HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new CommentRepository(http);

    const r = await repo.unlike('recipe-3', 'comment-7');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('CommentRepository.listByRecipe — like mapping', () => {
  it('maps likeCount and likedByMe from the DTO', async () => {
    const { http } = makeHttp(ok(makePageDto([validDto])));
    const repo = new CommentRepository(http);

    const r = await repo.listByRecipe('recipe-3', 1, 20);

    expect(r.ok).toBe(true);
    if (r.ok) {
      const comment = r.value.items[0];
      expect(comment).toBeInstanceOf(CommentEntity);
      expect(comment.likeCount).toBe(7);
      expect(comment.likedByMe).toBe(true);
    }
  });

  it('defaults likeCount to 0 and likedByMe to false when the DTO omits them', async () => {
    const partial = { ...validDto } as Partial<CommentDto>;
    delete partial.likeCount;
    delete partial.likedByMe;
    const { http } = makeHttp(ok(makePageDto([partial as CommentDto])));
    const repo = new CommentRepository(http);

    const r = await repo.listByRecipe('recipe-3', 1, 20);

    expect(r.ok).toBe(true);
    if (r.ok) {
      const comment = r.value.items[0];
      expect(comment.likeCount).toBe(0);
      expect(comment.likedByMe).toBe(false);
    }
  });

  it('encodes the recipe id in the list URL', async () => {
    const { http, calls } = makeHttp(ok(makePageDto([])));
    const repo = new CommentRepository(http);

    await repo.listByRecipe('recipe/3 a', 1, 20);

    expect(calls[0].url).toBe('/recipes/recipe%2F3%20a/comments');
  });
});

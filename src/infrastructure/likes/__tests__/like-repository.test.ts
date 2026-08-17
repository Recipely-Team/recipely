/**
 * `listLiked` feeds the Liked tab in My Recipes. What is worth pinning is the
 * request it makes: a page number written into a repository instead of taken
 * from the paging mapper is invisible in every type and pins the list to page
 * one forever (CLAUDE.md rule 23d).
 */

import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { LikeRepository } from '@infrastructure/likes/like-repository';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FIRST_PAGE, LIKED_RECIPES_PAGE_SIZE } from '@infrastructure/constants/api/api-paging';
import { HttpMethod } from '@infrastructure/network/http/http-method';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { Difficulty } from '@domain/recipes/difficulty';

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}

const makeHttp = (result: Result<unknown, unknown>): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const stub = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(result);
    }),
  );
  return { http: stub, calls };
};

const listItem = (id: string): RecipeListItemDto => ({
  id,
  name: `Recipe ${id}`,
  image: `https://cdn.example.com/${id}.webp`,
  cuisine: 'ITALIAN',
  category: 'DINNER',
  difficulty: Difficulty.Easy,
  totalTimeMinutes: 30,
  rating: 4.5,
  moderationStatus: 'approved',
  likeCount: 3,
  likedByMe: true,
  commentCount: 0,
  viewCount: 12,
});

describe('LikeRepository.listLiked', () => {
  it('GETs /me/likes with the paging query, not a hand-written page', async () => {
    const { http, calls } = makeHttp(ok({ items: [], total: 0, page: 1, pageSize: 100 }));

    await new LikeRepository(http).listLiked();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe(HttpMethod.Get);
    expect(calls[0]?.url).toBe(ApiRoutes.me.likes);
    expect(calls[0]?.params).toEqual({ page: FIRST_PAGE, pageSize: LIKED_RECIPES_PAGE_SIZE });
  });

  it('maps the response items into summary entities', async () => {
    const { http } = makeHttp(
      ok({ items: [listItem('r1'), listItem('r2')], total: 2, page: 1, pageSize: 100 }),
    );

    const result = await new LikeRepository(http).listLiked();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(result.value[0]?.likedByMe).toBe(true);
  });

  it('returns an empty list rather than a failure when nothing is liked', async () => {
    const { http } = makeHttp(ok({ items: [], total: 0, page: 1, pageSize: 100 }));

    const result = await new LikeRepository(http).listLiked();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
  });

  it('propagates the transport failure', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));

    const result = await new LikeRepository(http).listLiked();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toBe(failure);
  });
});

describe('LikeRepository.like / unlike', () => {
  it('POSTs and DELETEs the recipe like route', async () => {
    const { http, calls } = makeHttp(ok(undefined));
    const repo = new LikeRepository(http);

    await repo.like('r1');
    await repo.unlike('r1');

    expect(calls[0]).toMatchObject({ method: HttpMethod.Post, url: ApiRoutes.recipes.like('r1') });
    expect(calls[1]).toMatchObject({ method: HttpMethod.Delete, url: ApiRoutes.recipes.like('r1') });
  });
});

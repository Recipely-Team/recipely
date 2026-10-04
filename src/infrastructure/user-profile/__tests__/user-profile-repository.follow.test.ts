import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { UserProfileRepository } from '@infrastructure/user-profile/user-profile-repository';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const profileDto: UserProfileDto = {
  id: 'u-1',
  displayName: 'Ada Lovelace',
  bio: null,
  photoUrl: null,
  recipeCount: 12,
  totalLikes: 3400,
  totalViews: 91000,
  followerCount: 12400,
  followingCount: 3,
  isFollowedByMe: true,
  joinedAt: '2026-04-01T12:00:00.000Z',
  creatorTags: [{ platform: 'instagram', handle: 'ada.cooks' }],
};

const recipeDto: RecipeListItemDto = {
  id: 'r-1',
  name: 'Zeytinyağlı Enginar',
  image: 'https://cdn.recipely.io/recipe-images/r-1.webp',
  cuisine: CuisineKey.Turkish,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  totalTimeMinutes: 35,
  rating: 4.5,
  moderationStatus: 'approved',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  viewCount: 0,
};

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

describe('UserProfileRepository.getViewedProfile', () => {
  it('reads the follow standing beside the profile from GET /users/:id', async () => {
    const { http, calls } = makeHttp(ok(profileDto));

    const r = await new UserProfileRepository(http).getViewedProfile('u-1');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/users/u-1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.profile.displayName).toBe('Ada Lovelace');
      expect(r.value.profile.creatorTags[0]?.displayHandle).toBe('@ada.cooks');
      expect(r.value.followerCount).toBe(12400);
      expect(r.value.isFollowedByMe).toBe(true);
    }
  });

  it('reads a profile without follow fields as nobody following', async () => {
    const { followerCount: _count, isFollowedByMe: _mine, ...older } = profileDto;
    const { http } = makeHttp(ok(older));

    const r = await new UserProfileRepository(http).getViewedProfile('u-1');

    expect(r.ok && r.value.followerCount).toBe(0);
    expect(r.ok && r.value.isFollowedByMe).toBe(false);
  });
});

describe('UserProfileRepository.listUserRecipes', () => {
  it('asks GET /users/:id/recipes for the requested page', async () => {
    const { http, calls } = makeHttp(ok({ items: [recipeDto], total: 41, page: 2, pageSize: 20 }));

    const r = await new UserProfileRepository(http).listUserRecipes('u 1', 2, 20);

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/users/u%201/recipes');
    expect(calls[0].params).toEqual({ page: 2, pageSize: 20 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.items.map((recipe) => recipe.id)).toEqual(['r-1']);
      expect(r.value.page).toBe(2);
      expect(r.value.hasMore).toBe(true);
    }
  });

  it('propagates the HttpClient failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));

    const r = await new UserProfileRepository(http).listUserRecipes('u-1', 1, 20);

    expect(!r.ok && r.failure).toBe(failure);
  });
});

describe('UserProfileRepository.follow / unfollow', () => {
  it('follows with POST /users/:id/follow', async () => {
    const { http, calls } = makeHttp(ok(undefined));

    const r = await new UserProfileRepository(http).follow('u-1');

    expect(r.ok).toBe(true);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/users/u-1/follow');
  });

  it('unfollows with DELETE /users/:id/follow', async () => {
    const { http, calls } = makeHttp(ok(undefined));

    const r = await new UserProfileRepository(http).unfollow('u-1');

    expect(r.ok).toBe(true);
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('/users/u-1/follow');
  });

  it('propagates a failed follow unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));

    const r = await new UserProfileRepository(http).follow('u-1');

    expect(!r.ok && r.failure).toBe(failure);
  });
});

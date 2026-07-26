import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { UserProfileRepository } from '@infrastructure/user-profile/user-profile-repository';

const validDto: UserProfileDto = {
  id: 'u-1',
  displayName: 'Ada Lovelace',
  bio: 'Home kitchen, small steps.',
  photoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  recipeCount: 12,
  totalLikes: 3400,
  totalViews: 91000,
  joinedAt: '2026-04-01T12:00:00.000Z',
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

describe('UserProfileRepository.getById', () => {
  it('issues GET to the user profile endpoint and maps the DTO into a UserProfile', async () => {
    const { http, calls } = makeHttp(ok(validDto));
    const repo = new UserProfileRepository(http);

    const r = await repo.getById('u-1');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(UserProfileEntity);
      expect(r.value.displayName).toBe('Ada Lovelace');
      expect(r.value.bio).toBe('Home kitchen, small steps.');
      expect(r.value.recipeCount).toBe(12);
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/users/u-1');
  });

  it('encodes the user id in the URL', async () => {
    const { http, calls } = makeHttp(ok(validDto));
    const repo = new UserProfileRepository(http);

    await repo.getById('user/3 a');

    expect(calls[0].url).toBe('/users/user%2F3%20a');
  });

  it('propagates the HttpClient failure unchanged without mapping', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const repo = new UserProfileRepository(http);

    const r = await repo.getById('u-1');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });

  it('returns a ValidationFailure when the wire DTO has an empty displayName', async () => {
    const { http } = makeHttp(ok({ ...validDto, displayName: '' }));
    const repo = new UserProfileRepository(http);

    const r = await repo.getById('u-1');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.code).toBe('validation');
  });
});

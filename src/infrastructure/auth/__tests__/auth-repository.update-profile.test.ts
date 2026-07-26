import { NetworkFailure, UnauthorizedFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import type { RecipelyUserDto } from '@infrastructure/auth/recipely-user-dto';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

const userDto: RecipelyUserDto = {
  id: 'backend-user-1',
  email: 'u@example.com',
  displayName: 'New Name',
  photoUrl: 'https://cdn.recipely.net/avatars/old.png',
  bio: 'New bio',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// The session already in storage before the update — its token/expiry/id must be
// reused, since the profile endpoint returns only the user (no fresh token).
const buildCurrentSession = (): AuthSessionEntity => {
  const email = Email.create('old@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({
    id: 'session-user',
    email: email.value,
    displayName: 'Old Name',
    bio: 'Old bio',
  });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({
    id: 'session-id-123',
    accessToken: 'reused-token',
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    user: user.value,
  });
  if (!session.ok) throw new Error();
  return session.value;
};

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const stub = {
    request: jest.fn((config: RequestCall) => {
      calls.push({ method: config.method, url: config.url, data: config.data });
      return Promise.resolve(result);
    }),
  } as unknown as HttpClient;
  return { http: stub, calls };
};

const makeStorage = (
  loadResult: Result<AuthSessionEntity | null, unknown>,
): { storage: SecureTokenStorage; saved: AuthSessionEntity[] } => {
  const saved: AuthSessionEntity[] = [];
  const stub = {
    loadSession: jest.fn(() => Promise.resolve(loadResult)),
    saveSession: jest.fn((session: AuthSessionEntity) => {
      saved.push(session);
      return Promise.resolve(ok(undefined));
    }),
  } as unknown as SecureTokenStorage;
  return { storage: stub, saved };
};

describe('AuthRepository.updateProfile', () => {
  it('PATCHes /me/profile, reuses the current token/id and saves the mapped user', async () => {
    const current = buildCurrentSession();
    const { http, calls } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(ok(current));
    const repo = new AuthRepository(http, storage);

    const result = await repo.updateProfile({ displayName: 'New Name', bio: 'New bio' });

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      { method: 'PATCH', url: '/me/profile', data: { displayName: 'New Name', bio: 'New bio' } },
    ]);
    expect(saved).toHaveLength(1);
    if (result.ok) {
      expect(result.value).toBe(saved[0]);
      // Reused from the stored session.
      expect(result.value.id).toBe('session-id-123');
      expect(result.value.accessToken).toBe('reused-token');
      expect(result.value.expiresAt.toISOString()).toBe('2030-01-01T00:00:00.000Z');
      // Refreshed from the update response.
      expect(result.value.user.displayName).toBe('New Name');
      expect(result.value.user.bio).toBe('New bio');
    }
  });

  it('returns the http failure and never loads or saves a session', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const { storage, saved } = makeStorage(ok(buildCurrentSession()));
    const repo = new AuthRepository(http, storage);

    const result = await repo.updateProfile({ displayName: 'New Name' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(storage.loadSession).not.toHaveBeenCalled();
    expect(saved).toHaveLength(0);
  });

  it('returns UnauthorizedFailure when there is no current session and does not save', async () => {
    const { http } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(ok(null));
    const repo = new AuthRepository(http, storage);

    const result = await repo.updateProfile({ displayName: 'New Name' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBeInstanceOf(UnauthorizedFailure);
    expect(saved).toHaveLength(0);
  });

  it('propagates a storage load failure and does not save', async () => {
    const failure = new UnknownFailure('Failed to read session');
    const { http } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(fail(failure));
    const repo = new AuthRepository(http, storage);

    const result = await repo.updateProfile({ displayName: 'New Name' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(saved).toHaveLength(0);
  });
});

import { NetworkFailure, UnauthorizedFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import { FixedDeviceIdentity } from '@infrastructure/device/__fixtures__/fixed-device-identity';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { rebuildSessionWithUser } from '@infrastructure/auth/session/rebuild-session-with-user';

const USER_DTO = { id: 'u1', email: 'u@example.com', displayName: 'U', photoUrl: null, createdAt: '2026-01-01T00:00:00.000Z' };
// A JWT whose payload is {"exp": 1924992000} (2031-01-01).
const NEW_JWT = `x.${Buffer.from(JSON.stringify({ exp: 1924992000 })).toString('base64url')}.y`;

const session = (expiresAt: Date, refreshToken?: string): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error();
  const built = AuthSessionEntity.create({
    id: 'u1', accessToken: 'old-jwt', expiresAt, user: user.value, ...(refreshToken === undefined ? {} : { refreshToken }),
  });
  if (!built.ok) throw new Error();
  return built.value;
};

const memoryStorage = (initial: AuthSessionEntity | null, marker = false) => {
  let current = initial;
  return {
    loadSession: jest.fn(() => Promise.resolve(ok(current))),
    saveSession: jest.fn((next: AuthSessionEntity) => { current = next; return Promise.resolve(ok(undefined)); }),
    clear: jest.fn(() => { current = null; return Promise.resolve(ok(undefined)); }),
    hasSignedInMarker: jest.fn(() => Promise.resolve(marker)),
    get current() { return current; },
  };
};

const http = (answer: Result<unknown, unknown>) => {
  const calls: { url?: string | undefined; data?: unknown }[] = [];
  const client = withHttpVerbs(jest.fn((config: { url?: string; data?: unknown }) => {
    calls.push({ url: config.url, data: config.data });
    return Promise.resolve(answer);
  }));
  return { client, calls };
};

const repo = (client: ReturnType<typeof http>['client'], storage: ReturnType<typeof memoryStorage>, cookie = false) =>
  new AuthRepository(client, storage as unknown as SecureTokenStorage, new FixedDeviceIdentity(), cookie);

/** An API whose refresh answers in order: the first renewal succeeds, a second presenting the spent token is refused. */
const singleUseRefreshApi = () => {
  const calls: { url?: string | undefined; data?: unknown }[] = [];
  const answers: Result<unknown, unknown>[] = [
    ok({ token: NEW_JWT, refreshToken: 'rt-2', user: USER_DTO }),
    fail(new UnauthorizedFailure('refresh token reused')),
  ];
  const client = withHttpVerbs(jest.fn((config: { url?: string; data?: unknown }) => {
    calls.push({ url: config.url, data: config.data });
    const answer = answers.shift() ?? fail(new UnauthorizedFailure('no more answers'));
    return new Promise((resolve) => setTimeout(() => resolve(answer), 0));
  }));
  return { client, calls };
};

describe('AuthRepository renewal is single-flight', () => {
  const PAST = new Date('2020-01-01');

  it('a cold start whose first request also got a 401 renews once and stays signed in', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client, calls } = singleUseRefreshApi();
    const auth = repo(client, storage);

    const [restored, renewedFor401] = await Promise.all([auth.getCurrentSession(), auth.refreshSession()]);

    expect(calls).toHaveLength(1);
    expect(restored.ok && restored.value?.accessToken).toBe(NEW_JWT);
    expect(renewedFor401.ok).toBe(true);
    expect(storage.clear).not.toHaveBeenCalled();
    expect(storage.current?.refreshToken).toBe('rt-2');
  });

  it('two requests that hit a 401 together share one renewal', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client, calls } = singleUseRefreshApi();
    const auth = repo(client, storage);

    const [first, second] = await Promise.all([auth.refreshSession(), auth.refreshSession()]);

    expect(calls).toHaveLength(1);
    expect(first.ok && second.ok).toBe(true);
  });

  it('a later renewal, after the first finished, sends the new token', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client, calls } = singleUseRefreshApi();
    const auth = repo(client, storage);

    await auth.refreshSession();
    await auth.refreshSession();

    expect(calls.map((c) => c.data)).toEqual([{ refreshToken: 'rt-1' }, { refreshToken: 'rt-2' }]);
  });
});

describe('AuthRepository session renewal', () => {
  const PAST = new Date('2020-01-01');
  const FUTURE = new Date('2030-01-01');

  it('a user whose access token expired while the app was closed opens it still signed in', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client, calls } = http(ok({ token: NEW_JWT, refreshToken: 'rt-2', user: USER_DTO }));

    const result = await repo(client, storage).getCurrentSession();

    expect(calls).toEqual([{ url: '/auth/refresh', data: { refreshToken: 'rt-1' } }]);
    expect(result.ok && result.value?.accessToken).toBe(NEW_JWT);
    expect(storage.current?.refreshToken).toBe('rt-2');
  });

  it('a refused refresh signs out', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client } = http(fail(new UnauthorizedFailure('dead')));

    const result = await repo(client, storage).getCurrentSession();

    expect(result.ok && result.value).toBeNull();
    expect(storage.clear).toHaveBeenCalled();
  });

  it('a cold start offline keeps the stored session instead of signing out', async () => {
    const storage = memoryStorage(session(PAST, 'rt-1'));
    const { client } = http(fail(new NetworkFailure('offline')));

    const result = await repo(client, storage).getCurrentSession();

    expect(result.ok && result.value?.accessToken).toBe('old-jwt');
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('a live session is returned without a request', async () => {
    const { client, calls } = http(ok({}));

    await repo(client, memoryStorage(session(FUTURE, 'rt-1'))).getCurrentSession();

    expect(calls).toHaveLength(0);
  });

  it('on web, a reload restores the session from the cookie, sending no token', async () => {
    const { client, calls } = http(ok({ token: NEW_JWT, user: USER_DTO }));

    const result = await repo(client, memoryStorage(null, true), true).getCurrentSession();

    expect(calls).toEqual([{ url: '/auth/refresh', data: {} }]);
    expect(result.ok && result.value?.accessToken).toBe(NEW_JWT);
  });

  it('on web, a guest page load makes no refresh call', async () => {
    const { client, calls } = http(ok({}));

    await repo(client, memoryStorage(null, false), true).getCurrentSession();

    expect(calls).toHaveLength(0);
  });

  it('signing out revokes the sign-in on the server, then forgets it', async () => {
    const storage = memoryStorage(session(FUTURE, 'rt-1'));
    const { client, calls } = http(ok(undefined));

    await repo(client, storage).signOut();

    expect(calls).toEqual([{ url: '/auth/logout', data: { refreshToken: 'rt-1' } }]);
    expect(storage.current).toBeNull();
  });

  it('editing a profile keeps the refresh token', async () => {
    const storage = memoryStorage(session(FUTURE, 'rt-1'));

    const result = await rebuildSessionWithUser(storage as unknown as SecureTokenStorage, { ...USER_DTO, displayName: 'New' });

    expect(result.ok && result.value.refreshToken).toBe('rt-1');
  });
});

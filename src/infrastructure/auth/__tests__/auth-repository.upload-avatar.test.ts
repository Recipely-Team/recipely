import { NetworkFailure, UnauthorizedFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import type { RecipelyUserDto } from '@infrastructure/auth/recipely-user-dto';
import { AVATAR_UPLOAD_URL } from '@infrastructure/constants/api';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

const userDto: RecipelyUserDto = {
  id: 'backend-user-1',
  email: 'u@example.com',
  displayName: 'U',
  photoUrl: 'https://cdn.recipely.net/avatars/new.png',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// The session already in storage before the upload — its token/expiry/id must be
// reused, since the avatar endpoint returns only the user (no fresh token).
const buildCurrentSession = (): AuthSessionEntity => {
  const email = Email.create('old@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({
    id: 'session-user',
    email: email.value,
    displayName: 'Old Name',
    photoUrl: 'https://cdn.recipely.net/avatars/old.png',
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

interface UploadCall {
  url: string;
  formData: FormData;
}

const makeHttp = (
  result: Result<unknown, unknown>,
): { http: HttpClient; calls: UploadCall[] } => {
  const calls: UploadCall[] = [];
  const stub = {
    uploadMultipart: jest.fn((url: string, formData: FormData) => {
      calls.push({ url, formData });
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

describe('AuthRepository.uploadAvatar', () => {
  it('reuses the current token/id and saves a session with the new photoUrl', async () => {
    const current = buildCurrentSession();
    const { http, calls } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(ok(current));
    const repo = new AuthRepository(http, storage);

    const result = await repo.uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(AVATAR_UPLOAD_URL);
    expect(saved).toHaveLength(1);
    if (result.ok) {
      expect(result.value).toBe(saved[0]);
      // Reused from the stored session.
      expect(result.value.id).toBe('session-id-123');
      expect(result.value.accessToken).toBe('reused-token');
      expect(result.value.expiresAt.toISOString()).toBe('2030-01-01T00:00:00.000Z');
      // Refreshed from the upload response.
      expect(result.value.user.photoUrl).toBe('https://cdn.recipely.net/avatars/new.png');
    }
  });

  it('returns the http failure and never loads or saves a session', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));
    const { storage, saved } = makeStorage(ok(buildCurrentSession()));
    const repo = new AuthRepository(http, storage);

    const result = await repo.uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(storage.loadSession).not.toHaveBeenCalled();
    expect(saved).toHaveLength(0);
  });

  it('returns UnauthorizedFailure when there is no current session and does not save', async () => {
    const { http } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(ok(null));
    const repo = new AuthRepository(http, storage);

    const result = await repo.uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBeInstanceOf(UnauthorizedFailure);
    expect(saved).toHaveLength(0);
  });

  it('propagates a storage load failure and does not save', async () => {
    const failure = new UnknownFailure('Failed to read session');
    const { http } = makeHttp(ok({ user: userDto }));
    const { storage, saved } = makeStorage(fail(failure));
    const repo = new AuthRepository(http, storage);

    const result = await repo.uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(saved).toHaveLength(0);
  });
});

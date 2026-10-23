import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { SESSION_STORAGE_KEY, SHOPPING_FIRST_PAGE_STORAGE_KEY, SIGNED_IN_MARKER_STORAGE_KEY } from '@infrastructure/constants/storage';

const mockStore = new Map<string, string>();
const mockReads = jest.fn();

jest.mock('@infrastructure/storage/kv-store', () => ({
  kvStore: {
    getItem: (key: string) => {
      mockReads(key);
      return Promise.resolve({ ok: true, value: mockStore.get(key) ?? null });
    },
    setItem: (key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve({ ok: true, value: undefined });
    },
    removeItem: (key: string) => {
      mockStore.delete(key);
      return Promise.resolve({ ok: true, value: undefined });
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- must load after the mock
const { SecureTokenStorage } = require('@infrastructure/storage/secure-token-storage');

const session = (): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error();
  const built = AuthSessionEntity.create({
    id: 'u1', accessToken: 'jwt-secret', refreshToken: 'rt-secret', expiresAt: new Date('2030-01-01'), user: user.value,
  });
  if (!built.ok) throw new Error();
  return built.value;
};

describe('SecureTokenStorage', () => {
  beforeEach(() => {
    mockStore.clear();
    mockReads.mockClear();
  });

  it('keeps the refresh token with the session on native', async () => {
    const storage = new SecureTokenStorage(true);
    await storage.saveSession(session());

    const loaded = await new SecureTokenStorage(true).loadSession();

    expect(loaded.ok && loaded.value?.refreshToken).toBe('rt-secret');
  });

  it('reads storage once, not on every request', async () => {
    const storage = new SecureTokenStorage(true);
    await storage.saveSession(session());

    await storage.loadSession();
    await storage.loadSession();
    await storage.loadSession();

    expect(mockReads).not.toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });

  it('on web, no token ever reaches localStorage where page scripts could read it', async () => {
    const storage = new SecureTokenStorage(false);

    await storage.saveSession(session());

    expect([...mockStore.values()].join()).not.toMatch(/secret/);
    expect(mockStore.get(SIGNED_IN_MARKER_STORAGE_KEY)).toBe('1');
    const loaded = await storage.loadSession();
    expect(loaded.ok && loaded.value?.accessToken).toBe('jwt-secret');
  });

  it('on web, moves a session an older build left in localStorage into memory and deletes it', async () => {
    await new SecureTokenStorage(true).saveSession(session());
    const storage = new SecureTokenStorage(false);

    const loaded = await storage.loadSession();

    expect(loaded.ok && loaded.value?.accessToken).toBe('jwt-secret');
    expect(mockStore.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('forgets the session and the web marker on clear', async () => {
    const storage = new SecureTokenStorage(false);
    await storage.saveSession(session());

    await storage.clear();

    expect(await storage.hasSignedInMarker()).toBe(false);
    const loaded = await storage.loadSession();
    expect(loaded.ok && loaded.value).toBeNull();
  });

  it('signing out wipes the offline copy of the shopping list, so the next account never sees it', async () => {
    const storage = new SecureTokenStorage(true);
    await storage.saveSession(session());
    mockStore.set(SHOPPING_FIRST_PAGE_STORAGE_KEY, '{"query":"20","page":{}}');

    await storage.clear();

    expect(mockStore.has(SHOPPING_FIRST_PAGE_STORAGE_KEY)).toBe(false);
  });
});

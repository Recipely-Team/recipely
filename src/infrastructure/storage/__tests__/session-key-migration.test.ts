import { SESSION_STORAGE_KEY, LEGACY_SESSION_STORAGE_KEY } from '@infrastructure/constants/storage';

/**
 * The symptom this guards against has not happened yet, and that is the point.
 *
 * `SecureTokenStorage` carried its own `const STORAGE_KEY = 'layerly.session.v1'`
 * — a name left over from an earlier project — while `SESSION_STORAGE_KEY` sat
 * in the constants file unread. Anyone tidying that up by simply pointing the
 * class at the constant would have signed out every user holding a session,
 * with nothing failing in CI to say so.
 */

const mockStore = new Map<string, string>();

jest.mock('@infrastructure/storage/kv-store', () => ({
  kvStore: {
    getItem: (key: string) => Promise.resolve({ ok: true, value: mockStore.get(key) ?? null }),
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

const SESSION_JSON = JSON.stringify({
  id: 'session-1',
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresAt: new Date('2030-01-01T00:00:00.000Z').toISOString(),
  user: { id: 'user-1', email: 'cook@recipely.net', displayName: 'Cook' },
});

describe('a session written by an older build', () => {
  beforeEach(() => mockStore.clear());

  it('is still readable after the key was renamed', async () => {
    mockStore.set(LEGACY_SESSION_STORAGE_KEY, SESSION_JSON);

    const result = await new SecureTokenStorage().loadSession();

    expect(result.ok).toBe(true);
    expect(result.value?.id).toBe('session-1');
  });

  it('is moved to the current key so the fallback runs only once', async () => {
    mockStore.set(LEGACY_SESSION_STORAGE_KEY, SESSION_JSON);

    await new SecureTokenStorage().loadSession();

    expect(mockStore.get(SESSION_STORAGE_KEY)).toBe(SESSION_JSON);
    expect(mockStore.has(LEGACY_SESSION_STORAGE_KEY)).toBe(false);
  });

  it('is not consulted when a current session already exists', async () => {
    mockStore.set(SESSION_STORAGE_KEY, SESSION_JSON);
    mockStore.set(LEGACY_SESSION_STORAGE_KEY, 'stale-and-unparseable');

    const result = await new SecureTokenStorage().loadSession();

    expect(result.ok).toBe(true);
  });

  it('leaves nothing behind on sign-out', async () => {
    mockStore.set(SESSION_STORAGE_KEY, SESSION_JSON);
    mockStore.set(LEGACY_SESSION_STORAGE_KEY, SESSION_JSON);

    await new SecureTokenStorage().clear();

    expect(mockStore.size).toBe(0);
  });

  it('reports no session when neither key holds one', async () => {
    const result = await new SecureTokenStorage().loadSession();

    expect(result.ok).toBe(true);
    expect(result.value).toBeNull();
  });
});

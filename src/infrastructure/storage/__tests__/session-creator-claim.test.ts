import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorTag } from '@domain/creators/creator-tag';
import { SESSION_STORAGE_KEY } from '@infrastructure/constants/storage';

/**
 * The claims ride in the stored session, so Edit Profile shows them on a cold
 * start without a round trip — and a session stored before per-platform tags
 * (one `creator`) or before creator tags at all still restores.
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

const claimOf = (platform: string, handle: string, status: string): CreatorClaim => {
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error();
  const claim = CreatorClaim.create(tag.value, status);
  if (!claim.ok) throw new Error();
  return claim.value;
};

const sessionWith = (claims: CreatorClaims): AuthSessionEntity => {
  const email = Email.create('cook@recipely.net');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u-1', email: email.value, displayName: 'Cook', creatorClaims: claims });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({
    id: 's-1',
    accessToken: 'token',
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    user: user.value,
  });
  if (!session.ok) throw new Error();
  return session.value;
};

describe('SecureTokenStorage — creator claim', () => {
  beforeEach(() => mockStore.clear());

  it('restores both platforms\' claims it saved', async () => {
    const created = CreatorClaims.create([
      claimOf('instagram', 'chefada', 'approved'),
      claimOf('tiktok', 'chef.ada', 'pending'),
    ]);
    if (!created.ok) throw new Error();
    const storage = new SecureTokenStorage();

    await storage.saveSession(sessionWith(created.value));
    const loaded = await storage.loadSession();

    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value?.user.creatorClaims.equals(created.value)).toBe(true);
  });

  it('stores no creator field for a user without claims', async () => {
    const storage = new SecureTokenStorage();

    await storage.saveSession(sessionWith(CreatorClaims.empty()));

    const raw = JSON.parse(mockStore.get(SESSION_STORAGE_KEY) ?? '{}') as { user: Record<string, unknown> };
    expect('creatorTags' in raw.user).toBe(false);
    expect('creator' in raw.user).toBe(false);
  });

  it('restores the single claim of a session stored before per-platform tags', async () => {
    mockStore.set(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        id: 's-1',
        accessToken: 'token',
        expiresAt: '2030-01-01T00:00:00.000Z',
        user: { id: 'u-1', email: 'cook@recipely.net', displayName: 'Cook', creator: { platform: 'tiktok', handle: 'chef.ada', status: 'approved' } },
      }),
    );
    const loaded = await new SecureTokenStorage().loadSession();

    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value?.user.creatorClaims.forPlatform('tiktok')?.isApproved).toBe(true);
  });

  it('restores a session stored before creator tags, without a claim', async () => {
    mockStore.set(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        id: 's-1',
        accessToken: 'token',
        expiresAt: '2030-01-01T00:00:00.000Z',
        user: { id: 'u-1', email: 'cook@recipely.net', displayName: 'Cook' },
      }),
    );
    const loaded = await new SecureTokenStorage().loadSession();

    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value?.user.creatorClaims.isEmpty).toBe(true);
  });

  it('restores a session whose stored claim has no handle, without a claim instead of throwing', async () => {
    mockStore.set(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        id: 's-1',
        accessToken: 'token',
        expiresAt: '2030-01-01T00:00:00.000Z',
        user: { id: 'u-1', email: 'cook@recipely.net', displayName: 'Cook', creator: { platform: 'instagram', status: 'approved' } },
      }),
    );
    const loaded = await new SecureTokenStorage().loadSession();

    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value?.user.creatorClaims.isEmpty).toBe(true);
  });
});

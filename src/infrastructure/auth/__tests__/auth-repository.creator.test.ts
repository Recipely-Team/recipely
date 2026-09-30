import { NetworkFailure, UnauthorizedFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import { FixedDeviceIdentity } from '@infrastructure/device/__fixtures__/fixed-device-identity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';

const tagOf = (platform: string, handle: string): CreatorTag => {
  const r = CreatorTag.create(platform, handle);
  if (!r.ok) throw new Error('fixture tag');
  return r.value;
};

const approvedClaim = (): CreatorClaim => {
  const r = CreatorClaim.create(tagOf('instagram', 'old.handle'), CreatorStatus.Approved);
  if (!r.ok) throw new Error('fixture claim');
  return r.value;
};

const buildSession = (claim: CreatorClaim | null = null): AuthSessionEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u-1', email: email.value, displayName: 'Cook', creatorClaim: claim });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({
    id: 'session-1',
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

const makeRepo = (
  httpResult: Result<unknown, unknown>,
  stored: AuthSessionEntity | null = buildSession(),
): { repo: AuthRepository; calls: RequestCall[]; saved: AuthSessionEntity[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(jest.fn((config: RequestCall) => {
    calls.push({ method: config.method, url: config.url, data: config.data });
    return Promise.resolve(httpResult);
  })) as HttpClient;
  const saved: AuthSessionEntity[] = [];
  const storage = {
    loadSession: jest.fn(() => Promise.resolve(ok(stored))),
    saveSession: jest.fn((session: AuthSessionEntity) => {
      saved.push(session);
      return Promise.resolve(ok(undefined));
    }),
  } as unknown as SecureTokenStorage;
  return { repo: new AuthRepository(http, storage, new FixedDeviceIdentity()), calls, saved };
};

describe('AuthRepository.requestCreatorTag', () => {
  it('PUTs the normalised tag to /me/creator and persists the pending claim on the session user', async () => {
    const { repo, calls, saved } = makeRepo(ok({ platform: 'tiktok', handle: 'chef.ada', status: 'pending' }));

    const r = await repo.requestCreatorTag(tagOf('tiktok', '@Chef.Ada'));

    expect(calls).toEqual([{ method: 'PUT', url: '/me/creator', data: { platform: 'tiktok', handle: 'chef.ada' } }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.accessToken).toBe('reused-token');
    expect(r.value.user.creatorStatus).toBe(CreatorStatus.Pending);
    expect(r.value.user.creatorClaim?.tag.handle).toBe('chef.ada');
    expect(saved).toHaveLength(1);
  });

  it('propagates a server refusal without touching the stored session', async () => {
    const failure = new NetworkFailure('offline');
    const { repo, saved } = makeRepo(fail(failure));

    const r = await repo.requestCreatorTag(tagOf('instagram', 'chef'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
    expect(saved).toHaveLength(0);
  });

  it('fails with UnauthorizedFailure when the session is gone by the time the answer lands', async () => {
    const { repo } = makeRepo(ok({ platform: 'instagram', handle: 'chef', status: 'pending' }), null);

    const r = await repo.requestCreatorTag(tagOf('instagram', 'chef'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBeInstanceOf(UnauthorizedFailure);
  });
});

describe('AuthRepository.removeCreatorTag', () => {
  it('DELETEs /me/creator and persists a user without a claim', async () => {
    const { repo, calls, saved } = makeRepo(ok(undefined), buildSession(approvedClaim()));

    const r = await repo.removeCreatorTag();

    expect(calls).toEqual([{ method: 'DELETE', url: '/me/creator', data: undefined }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.user.creatorClaim).toBeNull();
      expect(r.value.user.creatorStatus).toBe(CreatorStatus.None);
    }
    expect(saved).toHaveLength(1);
  });
});

describe('AuthRepository.refreshCreatorClaim', () => {
  it('reads the claim from GET /me and stores what the admin decided', async () => {
    const { repo, calls } = makeRepo(
      ok({ id: 'u-1', creator: { platform: 'instagram', handle: 'old.handle', status: 'rejected' } }),
      buildSession(approvedClaim()),
    );

    const r = await repo.refreshCreatorClaim();

    expect(calls[0]).toMatchObject({ method: 'GET', url: '/me' });
    expect(r.ok && r.value.user.creatorStatus).toBe(CreatorStatus.Rejected);
  });

  it('clears the claim when /me answers creator: null', async () => {
    const { repo } = makeRepo(ok({ id: 'u-1', creator: null }), buildSession(approvedClaim()));

    const r = await repo.refreshCreatorClaim();

    expect(r.ok && r.value.user.creatorClaim).toBeNull();
  });

  it('keeps the stored claim when /me does not carry the field (older backend)', async () => {
    const { repo } = makeRepo(ok({ id: 'u-1' }), buildSession(approvedClaim()));

    const r = await repo.refreshCreatorClaim();

    expect(r.ok && r.value.user.creatorStatus).toBe(CreatorStatus.Approved);
  });
});

describe('AuthRepository.updateProfile — creator claim', () => {
  const userDto = {
    id: 'u-1',
    email: 'cook@example.com',
    displayName: 'Cook',
    photoUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('keeps the stored claim when the profile answer has no creator field', async () => {
    const { repo } = makeRepo(ok({ user: userDto }), buildSession(approvedClaim()));

    const r = await repo.updateProfile({ bio: 'new' });

    expect(r.ok && r.value.user.creatorStatus).toBe(CreatorStatus.Approved);
  });

  it('takes the claim from the profile answer when it carries one', async () => {
    const { repo } = makeRepo(ok({ user: { ...userDto, creator: null } }), buildSession(approvedClaim()));

    const r = await repo.updateProfile({ bio: 'new' });

    expect(r.ok && r.value.user.creatorClaim).toBeNull();
  });
});

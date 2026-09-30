import { ErrorMessageKey, NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { RequestCreatorTagUseCase } from '@application/creators/claim/request-creator-tag-use-case';
import { RemoveCreatorTagUseCase } from '@application/creators/claim/remove-creator-tag-use-case';
import { RefreshCreatorClaimUseCase } from '@application/creators/claim/refresh-creator-claim-use-case';

const session = ((): AuthSessionEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u-1', email: email.value, displayName: 'Cook' });
  if (!user.ok) throw new Error();
  const s = AuthSessionEntity.create({ id: 's-1', accessToken: 't', expiresAt: new Date('2030-01-01'), user: user.value });
  if (!s.ok) throw new Error();
  return s.value;
})();

/** Records the tag the use case hands over. */
class RecordingAuthRepository extends FakeAuthRepository {
  readonly requested: CreatorTag[] = [];
  override requestCreatorTag(tag: CreatorTag): Promise<Result<AuthSessionEntity, Failure>> {
    this.requested.push(tag);
    return super.requestCreatorTag(tag);
  }
}

describe('RequestCreatorTagUseCase', () => {
  it('normalises the handle and hands the repository a CreatorTag', async () => {
    const repo = new RecordingAuthRepository({ requestCreatorTagResult: ok(session) });

    const r = await new RequestCreatorTagUseCase(repo).execute({ platform: 'instagram', handle: ' @Chef.Ada ' });

    expect(r.ok).toBe(true);
    expect(repo.requested).toHaveLength(1);
    expect(repo.requested[0].platform).toBe('instagram');
    expect(repo.requested[0].handle).toBe('chef.ada');
  });

  it('fails a bad handle with the backend key, without calling the repository', async () => {
    const repo = new RecordingAuthRepository({ requestCreatorTagResult: ok(session) });

    const r = await new RequestCreatorTagUseCase(repo).execute({ platform: 'tiktok', handle: 'a' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.messageKey).toBe(ErrorMessageKey.creatorHandleInvalid);
    expect(repo.requested).toHaveLength(0);
  });

  it('passes a repository failure through', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new RecordingAuthRepository({ requestCreatorTagResult: fail(failure) });

    const r = await new RequestCreatorTagUseCase(repo).execute({ platform: 'instagram', handle: 'chef' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

describe('RemoveCreatorTagUseCase', () => {
  it('returns the repository result', async () => {
    const r = await new RemoveCreatorTagUseCase(new FakeAuthRepository({ removeCreatorTagResult: ok(session) })).execute();
    expect(r.ok && r.value).toBe(session);
  });
});

describe('RefreshCreatorClaimUseCase', () => {
  it('returns the repository result', async () => {
    const failure = new NetworkFailure('offline');
    const r = await new RefreshCreatorClaimUseCase(
      new FakeAuthRepository({ refreshCreatorClaimResult: fail(failure) }),
    ).execute();
    expect(!r.ok && r.failure).toBe(failure);
  });
});

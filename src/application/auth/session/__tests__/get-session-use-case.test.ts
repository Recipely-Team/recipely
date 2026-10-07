import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';

const buildSession = (expiresAt: Date): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({ id: 's1', accessToken: 'tok', expiresAt, user: user.value });
  if (!session.ok) throw new Error();
  return session.value;
};

describe('GetSessionUseCase', () => {
  it('restores a live stored session', async () => {
    const live = buildSession(new Date(Date.now() + 60_000));
    const result = await new GetSessionUseCase(new FakeAuthRepository({ currentSessionResult: ok(live) })).execute();

    expect(result).toEqual(ok(live));
  });

  it('answers null for an expired stored session', async () => {
    const expired = buildSession(new Date(Date.now() - 1_000));
    const result = await new GetSessionUseCase(new FakeAuthRepository({ currentSessionResult: ok(expired) })).execute();

    expect(result).toEqual(ok(null));
  });

  it('answers null when nothing is stored', async () => {
    const result = await new GetSessionUseCase(new FakeAuthRepository()).execute();

    expect(result).toEqual(ok(null));
  });

  it('propagates an unreadable store as its failure', async () => {
    const failure = new UnknownFailure('unreadable');
    const result = await new GetSessionUseCase(new FakeAuthRepository({ currentSessionResult: fail(failure) })).execute();

    expect(result).toEqual(fail(failure));
  });
});

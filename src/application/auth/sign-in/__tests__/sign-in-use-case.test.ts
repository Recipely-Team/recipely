import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import { UnauthorizedFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';

const buildSession = (): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({
    id: 's1',
    accessToken: 'tok',
    expiresAt: new Date(Date.now() + 60_000),
    user: user.value,
  });
  if (!session.ok) throw new Error();
  return session.value;
};

describe('SignInUseCase', () => {
  it('propagates success from the repository', async () => {
    const session = buildSession();
    const repo = new FakeAuthRepository({ signInResult: ok(session) });
    const useCase = new SignInUseCase(repo);

    const r = await useCase.execute('emilys', 'emilyspass');

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(session);
  });

  it('propagates failure from the repository', async () => {
    const failure = new UnauthorizedFailure('nope');
    const repo = new FakeAuthRepository({ signInResult: fail(failure) });
    const useCase = new SignInUseCase(repo);

    const r = await useCase.execute('bad', 'creds');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});

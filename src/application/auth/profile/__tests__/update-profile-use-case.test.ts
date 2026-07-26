import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import { NetworkFailure, UnauthorizedFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';

const buildSession = (): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({
    id: 'u1',
    email: email.value,
    displayName: 'New Name',
    bio: 'New bio',
  });
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

describe('UpdateProfileUseCase', () => {
  it('returns the updated session the repository resolves on success', async () => {
    const session = buildSession();
    const repo = new FakeAuthRepository({ updateProfileResult: ok(session) });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute({ displayName: 'New Name', bio: 'New bio' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(session);
  });

  it('propagates an UnauthorizedFailure from the repository unchanged', async () => {
    const failure = new UnauthorizedFailure('No active session to update');
    const repo = new FakeAuthRepository({ updateProfileResult: fail(failure) });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute({ displayName: 'New Name' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });

  it('propagates a NetworkFailure from the repository unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new FakeAuthRepository({ updateProfileResult: fail(failure) });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute({ bio: 'New bio' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });

  it('forwards the input fields to the repository unchanged', async () => {
    const session = buildSession();
    const calls: { displayName?: string; bio?: string }[] = [];
    const repo = new (class extends FakeAuthRepository {
      override updateProfile(input: { displayName?: string; bio?: string }) {
        calls.push(input);
        return Promise.resolve(ok(session));
      }
    })();
    const useCase = new UpdateProfileUseCase(repo);

    await useCase.execute({ displayName: 'New Name', bio: 'New bio' });

    expect(calls).toEqual([{ displayName: 'New Name', bio: 'New bio' }]);
  });
});

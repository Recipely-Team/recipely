import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
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
    displayName: 'U',
    photoUrl: 'https://cdn.recipely.net/avatars/new.png',
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

describe('UploadAvatarUseCase', () => {
  it('returns the updated session the repository resolves on success', async () => {
    const session = buildSession();
    const repo = new FakeAuthRepository({ uploadAvatarResult: ok(session) });
    const useCase = new UploadAvatarUseCase(repo);

    const result = await useCase.execute('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(session);
  });

  it('propagates an UnauthorizedFailure from the repository unchanged', async () => {
    const failure = new UnauthorizedFailure('No active session to update');
    const repo = new FakeAuthRepository({ uploadAvatarResult: fail(failure) });
    const useCase = new UploadAvatarUseCase(repo);

    const result = await useCase.execute('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });

  it('propagates a NetworkFailure from the repository unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new FakeAuthRepository({ uploadAvatarResult: fail(failure) });
    const useCase = new UploadAvatarUseCase(repo);

    const result = await useCase.execute('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });

  it('delegates the fileUri, fileName and mimeType to the repository unchanged', async () => {
    const session = buildSession();
    const calls: { fileUri: string; fileName: string; mimeType: string }[] = [];
    const repo = new (class extends FakeAuthRepository {
      override uploadAvatar(fileUri: string, fileName: string, mimeType: string) {
        calls.push({ fileUri, fileName, mimeType });
        return Promise.resolve(ok(session));
      }
    })();
    const useCase = new UploadAvatarUseCase(repo);

    await useCase.execute('file:///tmp/pic.jpg', 'pic.jpg', 'image/jpeg');

    expect(calls).toEqual([
      { fileUri: 'file:///tmp/pic.jpg', fileName: 'pic.jpg', mimeType: 'image/jpeg' },
    ]);
  });
});

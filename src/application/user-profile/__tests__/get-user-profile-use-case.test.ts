import { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { IUserProfileRepository } from '@domain/user-profile/i-user-profile-repository';

const buildProfile = (): UserProfileEntity => {
  const result = UserProfileEntity.create({
    id: 'u-1',
    displayName: 'Ada Lovelace',
    bio: null,
    photoUrl: null,
    recipeCount: 12,
    totalLikes: 3400,
    totalViews: 91000,
    joinedAt: new Date('2026-04-01T12:00:00.000Z'),
  });
  if (!result.ok) throw new Error('fixture profile failed validation');
  return result.value;
};

class StubRepository implements IUserProfileRepository {
  readonly calls: string[] = [];
  constructor(private readonly result: Result<UserProfileEntity, Failure>) {}
  getById(userId: string): Promise<Result<UserProfileEntity, Failure>> {
    this.calls.push(userId);
    return Promise.resolve(this.result);
  }
}

describe('GetUserProfileUseCase', () => {
  it('returns the profile the repository resolves on success', async () => {
    const profile = buildProfile();
    const repo = new StubRepository(ok(profile));
    const useCase = new GetUserProfileUseCase(repo);

    const result = await useCase.execute({ userId: 'u-1' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(profile);
  });

  it('forwards the userId to the repository unchanged', async () => {
    const repo = new StubRepository(ok(buildProfile()));
    const useCase = new GetUserProfileUseCase(repo);

    await useCase.execute({ userId: 'u-42' });

    expect(repo.calls).toEqual(['u-42']);
  });

  it('propagates a repository failure unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const repo = new StubRepository(fail(failure));
    const useCase = new GetUserProfileUseCase(repo);

    const result = await useCase.execute({ userId: 'u-1' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });
});

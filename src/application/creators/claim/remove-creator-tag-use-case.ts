import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';

/** Clears the signed-in user's claim on one platform and returns the session without it; the other platform's stays. */
export class RemoveCreatorTagUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(platform: CreatorPlatformType): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.removeCreatorTag(platform);
  }
}

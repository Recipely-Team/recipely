import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { CreatorClaimRepositoryInterface } from '@domain/auth/creator-claim-repository-interface';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';

/** Clears the signed-in user's claim on one platform and returns the session without it; the other platform's stays. */
export class RemoveCreatorTagUseCase {
  constructor(private readonly repo: CreatorClaimRepositoryInterface) {}

  execute(platform: CreatorPlatformType): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.removeCreatorTag(platform);
  }
}

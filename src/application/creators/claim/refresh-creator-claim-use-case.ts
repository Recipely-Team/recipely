import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { CreatorClaimRepositoryInterface } from '@domain/auth/creator-claim-repository-interface';

/**
 * Re-reads the signed-in user's claims (every platform) from the server, so an admin's approval
 * or rejection shows without signing in again. Edit Profile calls it on open.
 */
export class RefreshCreatorClaimUseCase {
  constructor(private readonly repo: CreatorClaimRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.refreshCreatorClaim();
  }
}

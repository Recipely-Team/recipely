import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Re-reads the signed-in user's claim from the server, so an admin's approval
 * or rejection shows without signing in again. Edit Profile calls it on open.
 */
export class RefreshCreatorClaimUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.refreshCreatorClaim();
  }
}

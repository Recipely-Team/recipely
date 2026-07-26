import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { IAuthRepository } from '@domain/auth/i-auth-repository';

/**
 * Retrieves the currently persisted `AuthSessionEntity`, or `null` if no session
 * exists (unauthenticated state).
 */
export class GetSessionUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  execute(): Promise<Result<AuthSessionEntity | null, Failure>> {
    return this.repo.getCurrentSession();
  }
}

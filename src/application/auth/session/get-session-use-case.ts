import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Retrieves the currently persisted `AuthSessionEntity`, or `null` if no session
 * exists (unauthenticated state).
 */
export class GetSessionUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity | null, Failure>> {
    return this.repo.getCurrentSession();
  }
}

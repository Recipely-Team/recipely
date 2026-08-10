import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Authenticates a user with email and password, returning a persisted
 * `AuthSessionEntity` on success.
 */
export class SignInUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.signIn(email, password);
  }
}

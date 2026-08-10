import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Triggers the native Google Sign-In flow and persists the resulting session.
 * Delegates entirely to `AuthRepositoryInterface.signInWithGoogle` so the use case
 * stays free of SDK details.
 */
export class SignInWithGoogleUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.signInWithGoogle();
  }
}

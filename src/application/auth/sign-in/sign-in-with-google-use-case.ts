import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { IAuthRepository } from '@domain/auth/i-auth-repository';

/**
 * Triggers the native Google Sign-In flow and persists the resulting session.
 * Delegates entirely to `IAuthRepository.signInWithGoogle` so the use case
 * stays free of SDK details.
 */
export class SignInWithGoogleUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.signInWithGoogle();
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Triggers the native Apple Sign-In sheet (iOS/macOS only) and persists the
 * resulting session. Delegates entirely to `AuthRepositoryInterface.signInWithApple`.
 */
export class SignInWithAppleUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.signInWithApple();
  }
}

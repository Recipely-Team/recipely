import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Terminates the current user session by clearing all persisted credentials.
 */
export class SignOutUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<void, Failure>> {
    return this.repo.signOut();
  }
}

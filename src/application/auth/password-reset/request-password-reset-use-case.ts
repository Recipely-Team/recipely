import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Sends a password-reset link email. Resolves ok regardless of whether the
 * email exists — enumeration-safe.
 */
export class RequestPasswordResetUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(email: string): Promise<Result<void, Failure>> {
    return this.repo.requestPasswordReset(email);
  }
}

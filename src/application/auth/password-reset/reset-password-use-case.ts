import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Completes a password reset using the token from the emailed link. Does
 * not create a new session — the user must sign in after resetting.
 */
export class ResetPasswordUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(token: string, newPassword: string): Promise<Result<void, Failure>> {
    return this.repo.resetPassword(token, newPassword);
  }
}

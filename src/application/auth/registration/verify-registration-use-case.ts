import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Confirms the emailed registration code and, on success, creates the account
 * and returns a persisted `AuthSessionEntity`.
 */
export class VerifyRegistrationUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(email: string, code: string): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.verifyRegistration(email, code);
  }
}

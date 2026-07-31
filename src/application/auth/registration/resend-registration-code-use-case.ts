import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/** Re-sends the registration verification code to a pending email. */
export class ResendRegistrationCodeUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(email: string): Promise<Result<RegistrationChallenge, Failure>> {
    return this.repo.resendRegistrationCode(email);
  }
}

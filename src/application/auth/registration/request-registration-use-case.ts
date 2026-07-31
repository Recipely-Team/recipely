import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Starts registration by requesting a verification code email for the given
 * credentials. The account is not created until `VerifyRegistrationUseCase`
 * confirms the emailed code.
 */
export class RequestRegistrationUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    return this.repo.requestRegistration(email, password, displayName);
  }
}

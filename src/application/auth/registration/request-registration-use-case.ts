import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { Email } from '@domain/common/email';

/**
 * Starts registration by requesting a verification code email for the given
 * credentials. The account is not created until `VerifyRegistrationUseCase`
 * confirms the emailed code. A malformed address fails before the request.
 */
export class RequestRegistrationUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    const address = Email.create(email);
    if (!address.ok) return address;
    return this.repo.requestRegistration(address.value.value, password, displayName);
  }
}

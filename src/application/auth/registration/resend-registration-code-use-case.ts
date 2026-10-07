import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { Email } from '@domain/common/email';

/** Re-sends the registration verification code to a pending email. */
export class ResendRegistrationCodeUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(email: string): Promise<Result<RegistrationChallenge, Failure>> {
    const address = Email.create(email);
    if (!address.ok) return address;
    return this.repo.resendRegistrationCode(address.value.value);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { Email } from '@domain/common/email';

/**
 * Sends a password-reset link email. Resolves ok regardless of whether the
 * email exists — enumeration-safe. A malformed address fails before the
 * request.
 */
export class RequestPasswordResetUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(email: string): Promise<Result<void, Failure>> {
    const address = Email.create(email);
    if (!address.ok) return address;
    return this.repo.requestPasswordReset(address.value.value);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { Email } from '@domain/common/email';

/**
 * Authenticates a user with email and password, returning a persisted
 * `AuthSessionEntity` on success. A malformed address fails here, as a
 * `ValidationFailure`, without a round-trip.
 */
export class SignInUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>> {
    const address = Email.create(email);
    if (!address.ok) return address;
    return this.repo.signIn(address.value.value, password);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Finishes a registration from the emailed "finish creating my account" link —
 * for the user who closed the app on the code screen and came back from their
 * inbox. Opening the link proves the inbox, as typing the code does.
 */
export class VerifyRegistrationLinkUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(token: string): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.verifyRegistrationLink(token);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { IAuthRepository } from '@domain/auth/i-auth-repository';

/**
 * Updates the signed-in user's editable profile fields (display name, bio) and
 * returns the refreshed, persisted `AuthSessionEntity`.
 */
export class UpdateProfileUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  execute(input: {
    displayName?: string;
    bio?: string;
  }): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.updateProfile(input);
  }
}

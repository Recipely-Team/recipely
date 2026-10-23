import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AccountRepositoryInterface } from '@domain/auth/account-repository-interface';
import type { UpdateProfileInput } from '@domain/auth/update-profile-input';

/**
 * Updates the signed-in user's editable profile fields (display name, bio) and
 * returns the refreshed, persisted `AuthSessionEntity`.
 */
export class UpdateProfileUseCase {
  constructor(private readonly repo: AccountRepositoryInterface) {}

  execute(input: UpdateProfileInput): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.updateProfile(input);
  }
}

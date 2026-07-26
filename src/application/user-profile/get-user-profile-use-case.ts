import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { IUserProfileRepository } from '@domain/user-profile/i-user-profile-repository';
import type { GetUserProfileInput } from '@application/user-profile/get-user-profile-input';

/** Fetches the public profile for any user by their ID. */
export class GetUserProfileUseCase {
  constructor(private readonly repo: IUserProfileRepository) {}

  execute(input: GetUserProfileInput): Promise<Result<UserProfileEntity, Failure>> {
    return this.repo.getById(input.userId);
  }
}

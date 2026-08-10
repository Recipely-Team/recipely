import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { GetUserProfileInput } from '@application/user-profile/get-user-profile-input';

/** Fetches the public profile for any user by their ID. */
export class GetUserProfileUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(input: GetUserProfileInput): Promise<Result<UserProfileEntity, Failure>> {
    return this.repo.getById(input.userId);
  }
}

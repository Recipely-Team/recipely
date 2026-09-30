import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { GetUserProfileInput } from '@application/user-profile/get-user-profile-input';

/** Fetches a public profile the way the caller sees it: with their follow standing. */
export class GetViewedUserProfileUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(input: GetUserProfileInput): Promise<Result<ViewedUserProfile, Failure>> {
    return this.repo.getViewedProfile(input.userId);
  }
}

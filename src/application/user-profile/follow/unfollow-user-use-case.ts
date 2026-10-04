import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { FollowUserInput } from '@application/user-profile/follow/follow-user-input';

/** Stops following a user as the signed-in caller (`DELETE /users/:id/follow`). */
export class UnfollowUserUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(input: FollowUserInput): Promise<Result<void, Failure>> {
    return this.repo.unfollow(input.userId);
  }
}

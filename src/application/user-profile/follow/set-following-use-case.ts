import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';

/** Follows (`true`) or stops following (`false`) a user as the signed-in caller (`POST` / `DELETE /users/:id/follow`). */
export class SetFollowingUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(userId: string, follow: boolean): Promise<Result<void, Failure>> {
    return follow ? this.repo.follow(userId) : this.repo.unfollow(userId);
  }
}

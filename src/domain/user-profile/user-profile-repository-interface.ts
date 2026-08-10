import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

/** Repository contract for fetching public user profiles. */
export interface UserProfileRepositoryInterface {
  getById(userId: string): Promise<Result<UserProfileEntity, Failure>>;
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { CreatorPage } from '@domain/creators/creator-page';

/** Repository contract for public user profiles and the creators list. */
export interface UserProfileRepositoryInterface {
  getById(userId: string): Promise<Result<UserProfileEntity, Failure>>;
  /** One page of approved creators with a published recipe, most-followed first. `page` is 1-based. */
  listCreators(page: number, pageSize: number): Promise<Result<CreatorPage, Failure>>;
}

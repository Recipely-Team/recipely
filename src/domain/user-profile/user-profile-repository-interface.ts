import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { RecipePage } from '@domain/recipes/list/recipe-page';

/** Repository contract for public user profiles, their recipes, following, and the creators list. */
export interface UserProfileRepositoryInterface {
  getById(userId: string): Promise<Result<UserProfileEntity, Failure>>;
  /** The same profile with the caller's follow standing (`false` for a guest). */
  getViewedProfile(userId: string): Promise<Result<ViewedUserProfile, Failure>>;
  /** One page of a user's published recipes. `page` is 1-based. */
  listUserRecipes(userId: string, page: number, pageSize: number): Promise<Result<RecipePage, Failure>>;
  /** Follows the user as the signed-in caller. */
  follow(userId: string): Promise<Result<void, Failure>>;
  /** Stops following the user as the signed-in caller. */
  unfollow(userId: string): Promise<Result<void, Failure>>;
  /** One page of approved creators with a published recipe, most-followed first. `page` is 1-based. */
  listCreators(page: number, pageSize: number): Promise<Result<CreatorPage, Failure>>;
}

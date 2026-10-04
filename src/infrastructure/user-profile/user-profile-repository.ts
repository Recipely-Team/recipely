import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { toUserProfile } from '@infrastructure/user-profile/user-profile-mapper';
import { toViewedUserProfile } from '@infrastructure/user-profile/to-viewed-user-profile';
import { toCreatorPage } from '@infrastructure/creators/to-creator-page';
import { toRecipePage } from '@infrastructure/recipes/to-recipe-page';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

/**
 * Implements `UserProfileRepositoryInterface` against the Recipely backend.
 *
 * @remarks
 * - **Guests are welcome on the reads.** `GET /users/:id`, `/users/:id/recipes`
 *   and `/users/creators` take optional auth; only follow and unfollow need a
 *   session.
 * - **A user's recipes come back in the feed's envelope**, so they map through
 *   the same `toRecipePage` and carry `hasMore` the same way.
 */
export class UserProfileRepository implements UserProfileRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async getById(userId: string): Promise<Result<UserProfileEntity, Failure>> {
    const result = await this.http.get<UserProfileDto>(ApiRoutes.users.byId(userId));
    if (!result.ok) {
      return result;
    }
    return toUserProfile(result.value);
  }

  async getViewedProfile(userId: string): Promise<Result<ViewedUserProfile, Failure>> {
    const result = await this.http.get<UserProfileDto>(ApiRoutes.users.byId(userId));
    if (!result.ok) {
      return result;
    }
    return toViewedUserProfile(result.value);
  }

  async listUserRecipes(userId: string, page: number, pageSize: number): Promise<Result<Page<RecipeSummaryEntity>, Failure>> {
    const result = await this.http.get<PageDto<RecipeListItemDto>>(ApiRoutes.users.recipes(userId), {
      params: toPageQuery({ page, pageSize }),
    });
    if (!result.ok) {
      return result;
    }
    return toRecipePage(result.value);
  }

  async follow(userId: string): Promise<Result<void, Failure>> {
    const result = await this.http.post(ApiRoutes.users.follow(userId), undefined);
    if (!result.ok) return result;
    return ok(undefined);
  }

  async unfollow(userId: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete(ApiRoutes.users.follow(userId));
    if (!result.ok) return result;
    return ok(undefined);
  }

  async listCreators(page: number, pageSize: number): Promise<Result<Page<CreatorSummaryEntity>, Failure>> {
    const result = await this.http.get<PageDto<CreatorSummaryDto>>(ApiRoutes.users.creators, {
      params: toPageQuery({ page, pageSize }),
    });
    if (!result.ok) {
      return result;
    }
    return toCreatorPage(result.value);
  }
}

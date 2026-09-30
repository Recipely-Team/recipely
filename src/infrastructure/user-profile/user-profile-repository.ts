import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { toUserProfile } from '@infrastructure/user-profile/user-profile-mapper';
import type { CreatorsPageDto } from '@infrastructure/creators/dtos/creators-page-dto';
import { toCreatorPage } from '@infrastructure/creators/to-creator-page';

/**
 * Implements `UserProfileRepositoryInterface` against the Recipely backend.
 * Fetches public profile data from `GET /users/:id` and the creators list from
 * `GET /users/creators`; both answer guests too.
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

  async listCreators(page: number, pageSize: number): Promise<Result<CreatorPage, Failure>> {
    const result = await this.http.get<CreatorsPageDto>(ApiRoutes.users.creators, {
      params: toPageQuery({ page, pageSize }),
    });
    if (!result.ok) {
      return result;
    }
    return toCreatorPage(result.value);
  }
}

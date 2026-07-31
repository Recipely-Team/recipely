import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { toUserProfile } from '@infrastructure/user-profile/user-profile-mapper';

/**
 * Implements `UserProfileRepositoryInterface` against the Recipely backend.
 * Fetches public profile data from `GET /users/:id`.
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
}

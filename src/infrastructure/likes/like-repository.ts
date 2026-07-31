import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api-routes';

/** Implements `LikeRepositoryInterface` against the Recipely backend. */
export class LikeRepository implements LikeRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async like(recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.post(ApiRoutes.recipes.like(recipeId), undefined);
    if (!result.ok) return fail(result.failure);
    return ok(void 0);
  }

  async unlike(recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete(ApiRoutes.recipes.like(recipeId));
    if (!result.ok) return fail(result.failure);
    return ok(void 0);
  }
}

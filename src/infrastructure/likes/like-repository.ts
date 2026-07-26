import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ILikeRepository } from '@domain/likes/i-like-repository';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api-routes';

/** Implements `ILikeRepository` against the Recipely backend. */
export class LikeRepository implements ILikeRepository {
  constructor(private readonly http: HttpClient) {}

  async like(recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'POST',
      url: ApiRoutes.recipes.like(recipeId),
    });
    if (!result.ok) return fail(result.failure);
    return ok(void 0);
  }

  async unlike(recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'DELETE',
      url: ApiRoutes.recipes.like(recipeId),
    });
    if (!result.ok) return fail(result.failure);
    return ok(void 0);
  }
}

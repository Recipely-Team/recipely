import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { IFavoritesRepository } from '@domain/favorites/i-favorites-repository';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { FavoritesListResponse } from '@infrastructure/favorites/favorites-list-response';

/**
 * Implements `IFavoritesRepository` against the Recipely backend. Persists
 * favorite additions and removals per recipe and loads the current user's
 * full set of favorited recipe IDs.
 */
export class FavoritesRepository implements IFavoritesRepository {
  constructor(private readonly http: HttpClient) {}

  async addFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'POST',
      url: ApiRoutes.recipes.favorite(recipeId),
    });

    if (!result.ok) {
      return fail(result.failure);
    }

    return ok(void 0);
  }

  async removeFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'DELETE',
      url: ApiRoutes.recipes.favorite(recipeId),
    });

    if (!result.ok) {
      return fail(result.failure);
    }

    return ok(void 0);
  }

  async getFavoritesIds(): Promise<Result<Set<string>, Failure>> {
    const result = await this.http.request<FavoritesListResponse>({
      method: 'GET',
      url: ApiRoutes.me.favorites,
      params: { pageSize: 20 },
    });

    if (!result.ok) {
       
      console.error('[FavoritesRepository] getFavoritesIds failed:', result.failure);
      return fail(result.failure);
    }

    const ids = new Set(result.value.items.map((r) => r.id));
     
    console.log('[FavoritesRepository] getFavoritesIds loaded:', Array.from(ids));
    return ok(ids);
  }
}

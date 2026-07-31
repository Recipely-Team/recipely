import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { FavoritesRepositoryInterface } from '@domain/favorites/favorites-repository-interface';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { FavoritesListResponse } from '@infrastructure/favorites/favorites-list-response';
import { mapRecipeSummaries } from '@infrastructure/recipes/map-recipe-summaries';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { FAVORITES_PAGE_SIZE } from '@infrastructure/constants/api';

/**
 * Implements `FavoritesRepositoryInterface` against the Recipely backend. Persists
 * favorite additions and removals per recipe and loads the user's saved
 * recipes as list rows — ids alone would leave the saved grid dependent on
 * some other screen having already loaded the same recipes.
 */
export class FavoritesRepository implements FavoritesRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async addFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.post(ApiRoutes.recipes.favorite(recipeId), undefined);

    if (!result.ok) {
      return fail(result.failure);
    }

    return ok(void 0);
  }

  async removeFavorite(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete(ApiRoutes.recipes.favorite(recipeId));

    if (!result.ok) {
      return fail(result.failure);
    }

    return ok(void 0);
  }

  async listFavorites(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    const result = await this.http.get<FavoritesListResponse>(ApiRoutes.me.favorites, { params: { pageSize: FAVORITES_PAGE_SIZE } });

    if (!result.ok) return fail(result.failure);

    return mapRecipeSummaries(result.value.items);
  }
}

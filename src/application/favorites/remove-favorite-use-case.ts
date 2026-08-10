import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FavoritesRepositoryInterface } from '@domain/favorites/favorites-repository-interface';

/**
 * Removes a recipe from the given user's favorites.
 */
export class RemoveFavoriteUseCase {
  constructor(private readonly repo: FavoritesRepositoryInterface) {}

  execute(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    return this.repo.removeFavorite(userId, recipeId);
  }
}

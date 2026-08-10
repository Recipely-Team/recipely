import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FavoritesRepositoryInterface } from '@domain/favorites/favorites-repository-interface';

/**
 * Marks a recipe as a favorite for the given user.
 */
export class AddFavoriteUseCase {
  constructor(private readonly repo: FavoritesRepositoryInterface) {}

  execute(userId: string, recipeId: string): Promise<Result<void, Failure>> {
    return this.repo.addFavorite(userId, recipeId);
  }
}

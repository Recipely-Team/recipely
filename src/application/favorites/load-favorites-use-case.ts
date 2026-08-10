import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FavoritesRepositoryInterface } from '@domain/favorites/favorites-repository-interface';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * Loads the recipes the current user has saved, in favourite order.
 */
export class LoadFavoritesUseCase {
  constructor(private readonly repo: FavoritesRepositoryInterface) {}

  execute(): Promise<Result<RecipeSummaryEntity[], Failure>> {
    return this.repo.listFavorites();
  }
}

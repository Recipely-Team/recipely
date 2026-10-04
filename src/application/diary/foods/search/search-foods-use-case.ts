import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** The first page of every food-search group for a non-empty query (the caller trims and checks it). */
export class SearchFoodsUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(query: string, pageSize: number): Promise<Result<FoodSearchResults, Failure>> {
    return this.repo.search(query, pageSize);
  }
}

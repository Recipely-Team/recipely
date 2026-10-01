import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** One page of the search's Products group — curated first, then branded packs. */
export class SearchProductsUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(query: string, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>> {
    return this.repo.searchProducts(query, page, pageSize);
  }
}

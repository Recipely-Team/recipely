import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** One page of curated products on a shelf (null: every shelf), one row per variant. */
export class ListFoodProductsUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(category: string | null, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>> {
    return this.repo.listProducts(category, page, pageSize);
  }
}

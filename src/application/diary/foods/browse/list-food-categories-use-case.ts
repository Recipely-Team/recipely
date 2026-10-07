import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { PageSizes } from '@application/config/page-sizes';
import type { Page } from '@domain/common/page';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** One page of the curated catalogue's shelves. */
export class ListFoodCategoriesUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(page: number): Promise<Result<Page<FoodCategory>, Failure>> {
    return this.repo.listCategories(page, PageSizes.foodList);
  }
}

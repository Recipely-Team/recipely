import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** One page of what the viewer logged before, most recent first — the Add food sheet's Recent tab. */
export class ListRecentFoodPageUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(page: number, pageSize: number): Promise<Result<Page<RecentFood>, Failure>> {
    return this.repo.listRecent(page, pageSize);
  }
}

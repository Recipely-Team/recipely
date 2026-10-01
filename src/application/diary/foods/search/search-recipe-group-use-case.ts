import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** One page of a recipe group (saved, mine, recipes); an empty query lists the group unfiltered. */
export class SearchRecipeGroupUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  execute(query: string, group: RecipeHitGroupType, page: number, pageSize: number): Promise<Result<Page<RecipeFoodHit>, Failure>> {
    return this.repo.searchRecipes(query, group, page, pageSize);
  }
}

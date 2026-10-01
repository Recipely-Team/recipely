import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { ListUserRecipesInput } from '@application/user-profile/recipes/list-user-recipes-input';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** One page of a user's published recipes, for their public profile. */
export class ListUserRecipesUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(input: ListUserRecipesInput): Promise<Result<Page<RecipeSummaryEntity>, Failure>> {
    return this.repo.listUserRecipes(input.userId, input.page, input.pageSize);
  }
}

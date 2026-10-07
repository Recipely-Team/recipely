import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { PageSizes } from '@application/config/page-sizes';

/** One 1-based page of a user's published recipes, for their public profile, `PageSizes.creatorRecipes` long. */
export class ListUserRecipesUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(userId: string, page: number): Promise<Result<Page<RecipeSummaryEntity>, Failure>> {
    return this.repo.listUserRecipes(userId, page, PageSizes.creatorRecipes);
  }
}

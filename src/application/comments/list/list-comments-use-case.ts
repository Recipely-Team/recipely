import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import type { Page } from '@domain/common/page';
import type { CommentView } from '@domain/comments/comment-view';
import { PageSizes } from '@application/config/page-sizes';

/** Fetches one page of a recipe's comments; the page size is `PageSizes.comments`. */
export class ListCommentsUseCase {
  constructor(private readonly repo: CommentRepositoryInterface) {}

  execute(recipeId: string, page: number): Promise<Result<Page<CommentView>, Failure>> {
    return this.repo.listByRecipe(recipeId, page, PageSizes.comments);
  }
}

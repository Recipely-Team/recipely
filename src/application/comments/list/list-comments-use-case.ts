import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import type { CommentPage } from '@domain/comments/comment-page';
import type { ListCommentsInput } from '@application/comments/list/list-comments-input';

/**
 * Fetches a paginated page of comments for a given recipe.
 */
export class ListCommentsUseCase {
  constructor(private readonly repo: CommentRepositoryInterface) {}

  execute(input: ListCommentsInput): Promise<Result<CommentPage, Failure>> {
    return this.repo.listByRecipe(input.recipeId, input.page, input.pageSize);
  }
}

import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import type { Page } from '@domain/common/page';
import type { CommentEntity } from '@domain/comments/comment-entity';

interface ListCommentsInput {
  recipeId: string;
  page: number;
  pageSize: number;
}

/**
 * Fetches a paginated page of comments for a given recipe.
 */
export class ListCommentsUseCase {
  constructor(private readonly repo: CommentRepositoryInterface) {}

  execute(input: ListCommentsInput): Promise<Result<Page<CommentEntity>, Failure>> {
    return this.repo.listByRecipe(input.recipeId, input.page, input.pageSize);
  }
}

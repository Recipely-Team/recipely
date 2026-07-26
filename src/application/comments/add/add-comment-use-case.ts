import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentEntity } from '@domain/comments/comment-entity';
import type { ICommentRepository } from '@domain/comments/i-comment-repository';
import type { AddCommentInput } from '@application/comments/add/add-comment-input';

/**
 * Posts a new comment body to the specified recipe and returns the created
 * `CommentEntity` entity.
 */
export class AddCommentUseCase {
  constructor(private readonly repo: ICommentRepository) {}

  execute(input: AddCommentInput): Promise<Result<CommentEntity, Failure>> {
    return this.repo.add(input.recipeId, input.body);
  }
}

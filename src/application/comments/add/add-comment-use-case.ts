import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentEntity } from '@domain/comments/comment-entity';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import { CommentBody } from '@domain/comments/comment-body';

interface AddCommentInput {
  recipeId: string;
  body: string;
}

/**
 * Posts a new comment to a recipe and returns the created `CommentEntity`.
 *
 * @remarks
 * - **Validates first:** the body goes through `CommentBody`, so a blank body never
 *   reaches the network and the trimmed text is what is sent.
 */
export class AddCommentUseCase {
  constructor(private readonly repo: CommentRepositoryInterface) {}

  async execute(input: AddCommentInput): Promise<Result<CommentEntity, Failure>> {
    const body = CommentBody.create(input.body);
    if (!body.ok) return body;
    return this.repo.add(input.recipeId, body.value.value);
  }
}

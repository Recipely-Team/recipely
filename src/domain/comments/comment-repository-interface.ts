import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentEntity } from '@domain/comments/comment-entity';
import type { Page } from '@domain/common/page';
import type { CommentView } from '@domain/comments/comment-view';

export interface CommentRepositoryInterface {
  listByRecipe(recipeId: string, page: number, pageSize: number): Promise<Result<Page<CommentView>, Failure>>;
  add(recipeId: string, body: string): Promise<Result<CommentEntity, Failure>>;
  remove(recipeId: string, commentId: string): Promise<Result<void, Failure>>;
  like(recipeId: string, commentId: string): Promise<Result<void, Failure>>;
  unlike(recipeId: string, commentId: string): Promise<Result<void, Failure>>;
}

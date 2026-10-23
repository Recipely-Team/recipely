import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';

export interface CommentsStore {
  byRecipe: Record<string, RecipeCommentsState>;
  load(recipeId: string): Promise<void>;
  loadMore(recipeId: string): Promise<void>;
  addComment(recipeId: string, body: string): Promise<boolean>;
  deleteComment(recipeId: string, commentId: string): Promise<boolean>;
  /**
   * Toggle a comment's like with an optimistic in-place update; rolls back on
   * failure. Returns the `Result` so the caller can surface a toast when the
   * toggle is rejected — the optimistic rollback alone is easy to miss.
   */
  toggleLike(recipeId: string, commentId: string): Promise<Result<void, Failure>>;
  /** Drops every cached comment thread. Called when the session ends. */
  clear(): void;
}

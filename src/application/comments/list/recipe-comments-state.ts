import type { Failure } from '@core/failure';
import type { CommentView } from '@domain/comments/comment-view';

export interface RecipeCommentsState {
  items: CommentView[];
  total: number;
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  error: Failure | null;
}

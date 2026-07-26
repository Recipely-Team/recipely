import type { Failure } from '@core/failure';
import type { CommentEntity } from '@domain/comments/comment-entity';

export interface RecipeCommentsState {
  items: CommentEntity[];
  total: number;
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  error: Failure | null;
}

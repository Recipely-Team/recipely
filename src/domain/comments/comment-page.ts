import type { CommentEntity } from '@domain/comments/comment-entity';

export interface CommentPage {
  items: CommentEntity[];
  total: number;
  page: number;
  pageSize: number;
}

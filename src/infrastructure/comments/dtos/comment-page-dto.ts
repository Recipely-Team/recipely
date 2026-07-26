import type { CommentDto } from '@infrastructure/comments/dtos/comment-dto';

export interface CommentPageDto {
  items: CommentDto[];
  total: number;
  page: number;
  pageSize: number;
}

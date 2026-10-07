import type { CommentEntity } from '@domain/comments/comment-entity';

/**
 * A comment as one viewer sees it: the entity plus whether that viewer liked it.
 *
 * @remarks
 * - **Viewer-relative data stays out of the entity** (rule 19): `likedByMe` belongs to the
 *   session reading the thread, not to the comment.
 */
export interface CommentView {
  readonly comment: CommentEntity;
  readonly likedByMe: boolean;
}

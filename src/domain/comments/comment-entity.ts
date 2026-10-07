import { BaseEntity } from '@core/entity/base-entity';
import type { CommentEntityProps } from '@domain/comments/comment-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { ViewerReaction } from '@domain/common/viewer-reaction';
import { isBlank } from '@core/guards/type-guards';


/**
 * Domain entity representing a user comment on a recipe. Validates that `id`,
 * `body`, `authorId`, and `recipeId` are all non-empty before construction.
 */
export class CommentEntity extends BaseEntity<CommentEntityProps> {
  private constructor(props: CommentEntityProps) {
    super(props);
  }

  static create(props: CommentEntityProps): Result<CommentEntity, ValidationFailure> {
    if (isBlank(props.id)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.idRequired, 'id'));
    }
    if (isBlank(props.body)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.bodyRequired, 'body'));
    }
    if (isBlank(props.authorId)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.authorIdRequired, 'authorId'));
    }
    if (isBlank(props.recipeId)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.recipeIdRequired, 'recipeId'));
    }
    return ok(new CommentEntity(props));
  }

  get body(): string {
    return this.props.body;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  /** Whether `userId` wrote this comment — a guest (`null`) never did. */
  isAuthoredBy(userId: string | null): boolean {
    return userId !== null && this.props.authorId === userId;
  }

  get recipeId(): string {
    return this.props.recipeId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get authorDisplayName(): string {
    return this.props.authorDisplayName;
  }

  get authorPhotoUrl(): string | null {
    return this.props.authorPhotoUrl;
  }

  get likeCount(): number {
    return this.props.likeCount;
  }

  /** A copy whose `likeCount` gains the viewer's like, or loses it (never below 0). */
  withViewerLike(liked: boolean): CommentEntity {
    const likeCount = ViewerReaction.of(this.props.likeCount, !liked).set(liked).count;
    return new CommentEntity({ ...this.props, likeCount });
  }
}

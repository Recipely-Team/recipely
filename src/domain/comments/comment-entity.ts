import { BaseEntity } from '@core/entity/base-entity';
import type { CommentEntityProps } from '@domain/comments/comment-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';


/**
 * Domain entity representing a user comment on a recipe. Validates that `id`,
 * `body`, `authorId`, and `recipeId` are all non-empty before construction.
 */
export class CommentEntity extends BaseEntity<CommentEntityProps> {
  private constructor(props: CommentEntityProps) {
    super(props);
  }

  static create(props: CommentEntityProps): Result<CommentEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.idRequired, 'id'));
    }
    if (props.body.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.bodyRequired, 'body'));
    }
    if (props.authorId.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.comment.authorIdRequired, 'authorId'));
    }
    if (props.recipeId.trim().length === ValueConstants.zero) {
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

  get likedByMe(): boolean {
    return this.props.likedByMe;
  }

  /**
   * Returns a new `CommentEntity` with `likedByMe` flipped and `likeCount` adjusted
   * (+1 when becoming liked, -1 when becoming unliked, clamped at 0). The
   * receiver is left unchanged so callers can keep the original for rollback.
   */
  withLikeToggled(): CommentEntity {
    const nextLiked = !this.props.likedByMe;
    const nextCount = nextLiked
      ? this.props.likeCount + 1
      : Math.max(ValueConstants.zero, this.props.likeCount - 1);
    return new CommentEntity({
      ...this.props,
      likedByMe: nextLiked,
      likeCount: nextCount,
    });
  }
}

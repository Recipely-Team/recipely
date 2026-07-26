import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';

export interface CommentProps {
  id: string;
  body: string;
  authorId: string;
  recipeId: string;
  createdAt: Date;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
}

/**
 * Domain entity representing a user comment on a recipe. Validates that `id`,
 * `body`, `authorId`, and `recipeId` are all non-empty before construction.
 */
export class CommentEntity extends BaseEntity<CommentProps> {
  private constructor(props: CommentProps) {
    super(props);
  }

  static create(props: CommentProps): Result<CommentEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('Comment id must be non-empty', 'id'));
    }
    if (props.body.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('Comment body must be non-empty', 'body'));
    }
    if (props.authorId.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('Comment authorId must be non-empty', 'authorId'));
    }
    if (props.recipeId.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('Comment recipeId must be non-empty', 'recipeId'));
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

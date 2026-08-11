import { BaseEntity } from '@core/entity/base-entity';
import type { NotificationEntityProps } from '@domain/notifications/notification-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { NotificationTargetKind } from '@domain/notifications/notification-target-kind';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { NotificationTarget } from '@domain/notifications/notification-target';
import { ValueConstants } from '@core/constants';


/**
 * Domain entity representing a backend notification (comment, like, follow,
 * AI completion, etc.). Validates that `id` is non-empty before construction.
 */
export class NotificationEntity extends BaseEntity<NotificationEntityProps> {
  private constructor(props: NotificationEntityProps) {
    super(props);
  }

  static create(props: NotificationEntityProps): Result<NotificationEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.notification.idRequired, 'id'));
    }
    return ok(new NotificationEntity(props));
  }

  get type(): string {
    return this.props.type;
  }

  get senderId(): string | null {
    return this.props.senderId;
  }

  get senderDisplayName(): string | null {
    return this.props.senderDisplayName;
  }

  get senderPhotoUrl(): string | null {
    return this.props.senderPhotoUrl;
  }

  get recipeId(): string | null {
    return this.props.recipeId;
  }

  get recipeTitle(): string | null {
    return this.props.recipeTitle;
  }

  get commentId(): string | null {
    return this.props.commentId;
  }

  /** Free-text payload (e.g. the comment body); null for types without text. */
  get message(): string | null {
    return this.props.message;
  }

  get read(): boolean {
    return this.props.read;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Derives where tapping this notification should navigate. Deliberately
   * data-driven rather than keyed off `type`: a `commentId` only ever
   * accompanies a `recipeId` (comment notifications always target a recipe),
   * so that combination wins; a bare `recipeId` (likes, AI completions, and
   * any future type we don't special-case) lands on the recipe; a `follow`
   * notification carries no `recipeId` — there is no public user-profile
   * route yet — so it has no destination and this returns `null`.
   */
  get target(): NotificationTarget | null {
    if (this.props.commentId !== null && this.props.recipeId !== null) {
      return { kind: NotificationTargetKind.Comment, recipeId: this.props.recipeId, commentId: this.props.commentId };
    }
    // A recipe outranks a draft when both are present. An import announces the
    // draft it produced, and publishing that draft turns it into a recipe — at
    // which point the server sets `recipeId` on the same notification. The
    // draft pointer is the older claim of the two, so the newer one wins;
    // checking the draft first sent the user to a row that no longer existed.
    if (this.props.recipeId !== null) {
      return { kind: NotificationTargetKind.Recipe, recipeId: this.props.recipeId };
    }
    // Only reachable while the import's draft is still unpublished: there is
    // no recipe yet, just something to finish.
    if (this.props.draftId !== null) {
      return { kind: NotificationTargetKind.Draft, draftId: this.props.draftId };
    }
    return null;
  }

  /**
   * Returns a copy of this notification with `read: true` (or `this` when
   * already read). Copies stay valid by construction, so no `Result` needed.
   */
  asRead(): NotificationEntity {
    if (this.props.read) return this;
    return new NotificationEntity({ ...this.props, read: true });
  }
}

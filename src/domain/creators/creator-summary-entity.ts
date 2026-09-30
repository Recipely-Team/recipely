import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorSummaryEntityProps } from '@domain/creators/creator-summary-entity-props';

/**
 * One item of the Explore "Creators" strip: an approved creator with at least
 * one published recipe.
 *
 * @remarks
 * - **A read model of a user's public profile**, not an aggregate of its own
 *   (architecture.md, Aggregates): its id IS the user id, and opening it loads
 *   the `UserProfileEntity`.
 * - Validates that `id` and `displayName` are non-empty, like the profile.
 */
export class CreatorSummaryEntity extends BaseEntity<CreatorSummaryEntityProps> {
  private constructor(props: CreatorSummaryEntityProps) {
    super(props);
  }

  static create(props: CreatorSummaryEntityProps): Result<CreatorSummaryEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.creatorSummary.idRequired, 'id'));
    }
    if (props.displayName.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.creatorSummary.displayNameRequired, 'displayName'));
    }
    return ok(new CreatorSummaryEntity(props));
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get photoUrl(): string | null {
    return this.props.photoUrl;
  }

  get creator(): CreatorTag {
    return this.props.creator;
  }

  get recipeCount(): number {
    return this.props.recipeCount;
  }

  get followerCount(): number {
    return this.props.followerCount;
  }
}
